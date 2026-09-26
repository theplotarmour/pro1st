import "server-only";

import { site } from "@/data/site";
import { getCart, getDeliveryOptions, type DeliveryAddressInput } from "@/lib/cart/service";
import {
  createOrder as createRazorpayOrder,
  fetchOrder as fetchRazorpayOrder,
  fetchPayment,
  verifyPaymentSignature,
  type RazorpayLineItem,
} from "@/lib/razorpay/client";
import {
  completeDraftOrder,
  createDraftOrder,
  findOrderByPaymentTag,
  getDiscountByCode,
  type DraftOrderAddress,
  type DraftOrderAppliedDiscount,
} from "@/lib/shopify/admin";
import type { Cart } from "@/types/product";

/**
 * Razorpay Magic Checkout → Shopify order.
 *
 * Magic Checkout inverts Standard Checkout's order of operations: the
 * address is collected INSIDE Razorpay's own hosted UI, live, as the buyer
 * types it — not upfront in a form this app renders. That means:
 *
 *   - The Razorpay order is created directly from the CART's line items
 *     (no address exists yet), which is what puts it in Magic Checkout
 *     mode at all — see `RazorpayLineItem`/`createOrder`.
 *   - Shipping rates and discount validation happen via two small public
 *     endpoints Razorpay calls server-to-server while the buyer is still
 *     typing (`/api/checkout/magic/shipping`, `/magic/promotions*`) —
 *     Razorpay's own docs describe these as unauthenticated by design, so
 *     they stay pure read/quote calculators, never a mutation.
 *   - The Shopify draft order — and the address it needs — doesn't get
 *     built until AFTER payment, once Razorpay has actually collected it
 *     (`customerDetails.shippingAddress` on the fetched Razorpay order).
 *
 * Idempotency changes shape to match: there's no pre-existing draft order
 * to check a status on anymore (it doesn't exist until payment completes),
 * so every draft order this flow creates is tagged `razorpay-payment-<id>`,
 * checked via `findOrderByPaymentTag` before creating another.
 */

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

const MIN_AMOUNT_PAISE = 100; // Razorpay's own floor: ₹1.

/** Strips the `gid://shopify/Cart/` prefix so the token fits Razorpay's 40-char receipt limit. */
function cartToken(cartId: string): string {
  return cartId.replace(/^gid:\/\/shopify\/Cart\//, "");
}
function cartIdFromToken(token: string): string {
  return `gid://shopify/Cart/${token}`;
}

async function loadCartOrThrow(): Promise<Cart> {
  const cart = await getCart();
  if (!cart || cart.lines.length === 0) {
    throw new CheckoutError("Your cart is empty.", 400);
  }
  return cart;
}

function toRazorpayLineItems(cart: Cart): RazorpayLineItem[] {
  return cart.lines.map((line) => ({
    sku: line.sku ?? line.variantId,
    variantId: line.variantId,
    pricePaise: Math.round(line.price * 100),
    quantity: line.quantity,
    name: line.title,
    description: line.variantTitle,
    imageUrl: line.image?.src,
    productUrl: `${site.url}/products/${line.handle}`,
  }));
}

export interface StartCheckoutResult {
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
}

/**
 * Creates the Magic Checkout order directly from the server-side cart — no
 * customer input yet. `amountPaise` is the product subtotal only; Magic
 * Checkout's own UI adds the shipping fee (from `/magic/shipping`) and
 * subtracts any applied discount (from `/magic/promotions/apply`) before
 * the buyer pays, which is the reason those two endpoints exist at all.
 */
export async function startCheckout(): Promise<StartCheckoutResult> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  if (!keyId) {
    throw new CheckoutError("Razorpay is not configured.", 500);
  }

  const cart = await loadCartOrThrow();

  const amountPaise = Math.round(cart.subtotal * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < MIN_AMOUNT_PAISE) {
    throw new CheckoutError(
      `Cart subtotal (${cart.subtotal}) is below the minimum payable amount.`,
      400,
    );
  }

  const razorpayOrder = await createRazorpayOrder({
    amountPaise,
    currency: cart.currency,
    receipt: cartToken(cart.id),
    notes: { cartId: cart.id },
    lineItems: toRazorpayLineItems(cart),
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amountPaise,
    currency: razorpayOrder.currency,
    keyId,
  };
}

/* ------------------------------------------------------------------ *
 * Shipping — /api/checkout/magic/shipping
 * ------------------------------------------------------------------ */

export interface ShippingQuoteAddress {
  id: string;
  address1?: string;
  city?: string;
  state?: string;
  zipcode: string;
  country: string;
}

export interface ShippingQuoteResult {
  id: string;
  shippingMethods: {
    id: string;
    name: string;
    serviceable: boolean;
    shippingFeePaise: number;
  }[];
}

/**
 * Resolves the cart directly from the request's `order_id` (= the receipt
 * this app set at order-creation, the cart's own token) rather than fetching
 * the Razorpay order — this endpoint is read-only and unauthenticated by
 * Razorpay's own design, so the extra round trip buys nothing.
 *
 * Known simplification: Razorpay's documented request shape for this
 * endpoint only shows zipcode/state/country, no street address, which may
 * be an earlier, coarser call before the buyer finishes the form. When
 * `address1`/`city` are missing, Shopify's delivery calculation can't run
 * (both are required), so that address is reported not serviceable rather
 * than guessing — real rates return once the fuller address arrives.
 */
export async function getShippingQuote(
  cartToken_: string,
  addresses: ShippingQuoteAddress[],
): Promise<ShippingQuoteResult[]> {
  const cartId = cartIdFromToken(cartToken_);

  return Promise.all(
    addresses.map(async (address): Promise<ShippingQuoteResult> => {
      if (!address.address1 || !address.city) {
        return { id: address.id, shippingMethods: [] };
      }

      const input: DeliveryAddressInput = {
        address1: address.address1,
        city: address.city,
        province: address.state,
        zip: address.zipcode,
        country: address.country,
      };

      try {
        const options = await getDeliveryOptions(cartId, input);
        return {
          id: address.id,
          shippingMethods: options.map((option) => ({
            id: option.handle,
            name: option.title,
            serviceable: true,
            shippingFeePaise: Math.round(option.amount * 100),
          })),
        };
      } catch {
        // A cart that no longer exists, or an address Shopify's shipping
        // profiles don't cover — either way, not serviceable, not an error
        // the buyer should see as a broken checkout.
        return { id: address.id, shippingMethods: [] };
      }
    }),
  );
}

/* ------------------------------------------------------------------ *
 * Promotions — /api/checkout/magic/promotions*
 * ------------------------------------------------------------------ */

export interface PromotionResult {
  code: string;
  valuePaise: number;
  valueType: "FIXED_AMOUNT" | "PERCENTAGE";
  description: string;
}

/**
 * Validates a discount code against Shopify's own Discounts (merchant
 * creates these normally in Shopify admin — no separate discount system).
 * Checks the subtotal minimum; a quantity-based minimum requirement is not
 * checked (Shopify's schema exposes it as a distinct type this doesn't
 * branch on) — noted here rather than silently ignored.
 */
export async function validateDiscountCode(
  code: string,
  cartToken_: string,
): Promise<PromotionResult> {
  const cart = await getCart();
  if (!cart) throw new CheckoutError("Cart no longer exists.", 400);
  if (cartToken(cart.id) !== cartToken_) {
    throw new CheckoutError("Code does not apply to this cart.", 400);
  }

  const discount = await getDiscountByCode(code);
  if (!discount) {
    throw new CheckoutError("This code is invalid or has expired.", 400);
  }
  if (discount.minimumSubtotal !== null && cart.subtotal < discount.minimumSubtotal) {
    throw new CheckoutError(
      `This code needs a cart subtotal of at least ${discount.minimumSubtotal}.`,
      400,
    );
  }

  const valuePaise =
    discount.valueType === "PERCENTAGE"
      ? Math.round(cart.subtotal * 100 * (discount.value / 10000))
      : Math.round(discount.value * 100);

  return { code, valuePaise, valueType: discount.valueType, description: discount.title };
}

/* ------------------------------------------------------------------ *
 * Completion — after payment
 * ------------------------------------------------------------------ */

export interface CompletePaymentResult {
  orderName: string;
  alreadyCompleted: boolean;
}

export interface VerifyAndCompleteInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  /** The code the buyer applied inside Magic Checkout, if any — re-validated here. */
  appliedCode?: string;
}

/**
 * Entry point for the frontend success callback (`verify-payment` route).
 * Verifies the `razorpay_signature` checkout.js hands back, then completes.
 */
export async function verifyAndCompletePayment(
  input: VerifyAndCompleteInput,
): Promise<CompletePaymentResult> {
  const valid = verifyPaymentSignature({
    orderId: input.razorpayOrderId,
    paymentId: input.razorpayPaymentId,
    signature: input.razorpaySignature,
  });
  if (!valid) {
    throw new CheckoutError("Payment signature verification failed.", 400);
  }
  return completePayment(input.razorpayOrderId, input.razorpayPaymentId, input.appliedCode);
}

/**
 * Entry point for the Razorpay webhook. The webhook route already verified
 * authenticity via `x-razorpay-signature` (HMAC over the raw body with
 * RAZORPAY_WEBHOOK_SECRET) — a *different* secret from the checkout.js
 * `razorpay_signature` field, which webhook payloads don't even carry. So
 * this skips `verifyPaymentSignature` and goes straight to completion; the
 * captured-status check and idempotency guard below still apply.
 */
export async function completePaymentFromWebhook(
  razorpayOrderId: string,
  razorpayPaymentId: string,
): Promise<CompletePaymentResult> {
  return completePayment(razorpayOrderId, razorpayPaymentId);
}

async function completePayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  appliedCode?: string,
): Promise<CompletePaymentResult> {
  // Idempotency first, before any Razorpay/Shopify calls that don't need to
  // happen twice for a retry or a webhook racing the frontend callback.
  const existingOrder = await findOrderByPaymentTag(razorpayPaymentId);
  if (existingOrder) {
    return { orderName: existingOrder.name, alreadyCompleted: true };
  }

  const payment = await fetchPayment(razorpayPaymentId);
  if (payment.orderId !== razorpayOrderId) {
    throw new CheckoutError("Payment does not belong to this order.", 400);
  }
  if (payment.status !== "captured") {
    throw new CheckoutError(
      `Payment is not captured (status: ${payment.status}).`,
      400,
    );
  }

  // The cart id and the buyer's address both come from Razorpay's own
  // record of the order — the trusted side, not anything a client request
  // claims. `customerDetails` is only populated once Magic Checkout has
  // actually collected it.
  const razorpayOrder = await fetchRazorpayOrder(razorpayOrderId);
  const cartId = razorpayOrder.notes.cartId;
  const shippingAddress = razorpayOrder.customerDetails?.shippingAddress;
  const customerEmail = razorpayOrder.customerDetails?.email;
  if (!cartId || !shippingAddress || !customerEmail) {
    throw new CheckoutError(
      "Payment succeeded but Magic Checkout has not recorded a shipping address for it yet.",
      400,
    );
  }

  const { line1, city, zipcode } = shippingAddress;
  if (!line1 || !city || !zipcode) {
    throw new CheckoutError(
      "Payment succeeded but the recorded shipping address is incomplete.",
      400,
    );
  }

  const cart = await getCart();
  if (!cart || cart.id !== cartId) {
    throw new CheckoutError("The cart for this order no longer exists.", 400);
  }

  let appliedDiscount: DraftOrderAppliedDiscount | undefined;
  if (appliedCode) {
    const discount = await getDiscountByCode(appliedCode);
    if (discount) {
      appliedDiscount = {
        value: discount.value,
        valueType: discount.valueType,
        title: discount.title,
      };
    }
  }

  const [firstName, ...rest] = (razorpayOrder.customerDetails?.name ?? "Customer")
    .trim()
    .split(/\s+/);
  const address: DraftOrderAddress = {
    firstName: firstName || "Customer",
    lastName: rest.join(" ") || "-",
    address1: line1,
    address2: shippingAddress.line2,
    city,
    province: shippingAddress.state,
    zip: zipcode,
    country: shippingAddress.country ?? "IN",
    phone: razorpayOrder.customerDetails?.contact ?? undefined,
  };

  const draftOrder = await createDraftOrder({
    email: customerEmail,
    lineItems: cart.lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
    })),
    shippingAddress: address,
    tags: ["razorpay", `razorpay-payment-${razorpayPaymentId}`],
    note: `Razorpay Magic Checkout — payment ${razorpayPaymentId}`,
    appliedDiscount,
  });

  const completed = await completeDraftOrder(draftOrder.id);
  return {
    orderName: completed.order?.name ?? completed.name,
    alreadyCompleted: false,
  };
}
