import "server-only";

import { cookies } from "next/headers";
import { storefront } from "@/lib/shopify/client";
import { mapCart, type RawCart } from "@/lib/shopify/map";
import {
  CART_CREATE_MUTATION,
  CART_DELIVERY_ADDRESSES_ADD_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
} from "@/lib/shopify/queries";
import type { Cart } from "@/types/product";

/**
 * Cart service.
 *
 * Shopify owns the cart, the checkout, the payment and the order. This file
 * holds nothing but the cart's ID, in an httpOnly cookie — there is no local
 * mirror of cart state to drift out of sync, and no order data in this app.
 */

const CART_COOKIE = "pro1st_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // Shopify expires carts at ~10 days.

interface CartPayload {
  cart: RawCart | null;
  userErrors: { field?: string[]; message: string }[];
}

/** Cart calls must never be cached — a cached cart is someone else's cart. */
const LIVE = { revalidate: 0 } as const;

async function readCartId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value;
}

async function writeCartId(id: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

async function clearCartId(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

function unwrap(payload: CartPayload | undefined, operation: string): Cart {
  if (!payload) throw new Error(`${operation}: Shopify returned no payload.`);
  if (payload.userErrors.length > 0) {
    throw new Error(payload.userErrors.map((e) => e.message).join("; "));
  }
  if (!payload.cart) throw new Error(`${operation}: Shopify returned no cart.`);
  return mapCart(payload.cart);
}

/** The current cart, or null when the visitor has never added anything. */
export async function getCart(): Promise<Cart | null> {
  const id = await readCartId();
  if (!id) return null;

  const data = await storefront<{ cart: RawCart | null }>(CART_QUERY, {
    variables: { id },
    ...LIVE,
  });

  // Shopify expires carts, and a completed checkout retires one. Either way
  // the stale ID must go, or the visitor is stuck with a dead cart.
  if (!data.cart) {
    await clearCartId();
    return null;
  }

  return mapCart(data.cart);
}

export async function addToCart(
  variantId: string,
  quantity = 1,
): Promise<Cart> {
  const existingId = await readCartId();
  const lines = [{ merchandiseId: variantId, quantity }];

  if (existingId) {
    const data = await storefront<{ cartLinesAdd: CartPayload }>(
      CART_LINES_ADD_MUTATION,
      { variables: { cartId: existingId, lines }, ...LIVE },
    );
    // A cart that vanished server-side falls through to creating a new one
    // rather than throwing at the visitor.
    if (data.cartLinesAdd?.cart) return unwrap(data.cartLinesAdd, "addToCart");
    await clearCartId();
  }

  const created = await storefront<{ cartCreate: CartPayload }>(
    CART_CREATE_MUTATION,
    { variables: { lines }, ...LIVE },
  );
  const cart = unwrap(created.cartCreate, "createCart");
  await writeCartId(cart.id);
  return cart;
}

export async function updateCartLine(
  lineId: string,
  quantity: number,
): Promise<Cart | null> {
  const cartId = await readCartId();
  if (!cartId) return null;

  if (quantity <= 0) return removeCartLine(lineId);

  const data = await storefront<{ cartLinesUpdate: CartPayload }>(
    CART_LINES_UPDATE_MUTATION,
    { variables: { cartId, lines: [{ id: lineId, quantity }] }, ...LIVE },
  );
  return unwrap(data.cartLinesUpdate, "updateCartLine");
}

export async function removeCartLine(lineId: string): Promise<Cart | null> {
  const cartId = await readCartId();
  if (!cartId) return null;

  const data = await storefront<{ cartLinesRemove: CartPayload }>(
    CART_LINES_REMOVE_MUTATION,
    { variables: { cartId, lineIds: [lineId] }, ...LIVE },
  );
  return unwrap(data.cartLinesRemove, "removeCartLine");
}

export async function clearCart(): Promise<Cart | null> {
  const cart = await getCart();
  if (!cart || cart.lines.length === 0) return cart;

  const cartId = cart.id;
  const data = await storefront<{ cartLinesRemove: CartPayload }>(
    CART_LINES_REMOVE_MUTATION,
    {
      variables: { cartId, lineIds: cart.lines.map((line) => line.id) },
      ...LIVE,
    },
  );
  return unwrap(data.cartLinesRemove, "clearCart");
}

export interface DeliveryAddressInput {
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
}

export interface DeliveryOption {
  handle: string;
  title: string;
  amount: number;
  currency: string;
}

interface CartDeliveryAddressesAddPayload {
  cart: {
    deliveryGroups: {
      nodes: {
        deliveryOptions: {
          handle: string;
          title: string;
          estimatedCost: { amount: string; currencyCode: string };
        }[];
      }[];
    };
  } | null;
  userErrors: { field?: string[]; message: string }[];
}

/**
 * Real Shopify-computed shipping rates for Magic Checkout's shipping-info
 * endpoint (src/app/api/checkout/magic/shipping/route.ts) — not an invented
 * flat-rate table. Attaches the address as a one-off delivery address on the
 * existing cart and reads back whatever Shopify's own shipping profiles
 * would charge for it.
 */
export async function getDeliveryOptions(
  cartId: string,
  address: DeliveryAddressInput,
): Promise<DeliveryOption[]> {
  const data = await storefront<{
    cartDeliveryAddressesAdd: CartDeliveryAddressesAddPayload;
  }>(CART_DELIVERY_ADDRESSES_ADD_MUTATION, {
    variables: {
      cartId,
      addresses: [
        {
          address: {
            deliveryAddress: {
              address1: address.address1,
              address2: address.address2,
              city: address.city,
              provinceCode: address.province,
              zip: address.zip,
              countryCode: address.country,
            },
          },
          oneTimeUse: true,
          selected: true,
        },
      ],
    },
    ...LIVE,
  });

  if (data.cartDeliveryAddressesAdd.userErrors.length > 0) {
    throw new Error(
      data.cartDeliveryAddressesAdd.userErrors.map((e) => e.message).join("; "),
    );
  }

  const groups = data.cartDeliveryAddressesAdd.cart?.deliveryGroups.nodes ?? [];
  return groups.flatMap((group) =>
    group.deliveryOptions.map((option) => ({
      handle: option.handle,
      title: option.title,
      amount: Number(option.estimatedCost.amount),
      currency: option.estimatedCost.currencyCode,
    })),
  );
}
