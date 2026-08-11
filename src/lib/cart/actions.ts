"use server";

import type { Cart } from "@/types/product";
import * as service from "./service";

/**
 * Server actions — the client's only route to the cart.
 *
 * Each returns the full cart so the client never has to guess what changed,
 * and errors come back as data rather than thrown exceptions so the UI can
 * show a real message instead of an error boundary.
 */

export interface CartResult {
  cart: Cart | null;
  error?: string;
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong talking to the store.";
}

export async function fetchCartAction(): Promise<CartResult> {
  try {
    return { cart: await service.getCart() };
  } catch (error) {
    return { cart: null, error: toMessage(error) };
  }
}

export async function addToCartAction(
  variantId: string,
  quantity = 1,
): Promise<CartResult> {
  try {
    return { cart: await service.addToCart(variantId, quantity) };
  } catch (error) {
    return { cart: null, error: toMessage(error) };
  }
}

export async function updateCartLineAction(
  lineId: string,
  quantity: number,
): Promise<CartResult> {
  try {
    return { cart: await service.updateCartLine(lineId, quantity) };
  } catch (error) {
    return { cart: null, error: toMessage(error) };
  }
}

export async function removeCartLineAction(
  lineId: string,
): Promise<CartResult> {
  try {
    return { cart: await service.removeCartLine(lineId) };
  } catch (error) {
    return { cart: null, error: toMessage(error) };
  }
}

export async function clearCartAction(): Promise<CartResult> {
  try {
    return { cart: await service.clearCart() };
  } catch (error) {
    return { cart: null, error: toMessage(error) };
  }
}
