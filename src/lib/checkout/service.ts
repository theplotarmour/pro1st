import "server-only";

import { getCart } from "@/lib/cart/service";
import {
  createOrder as createRazorpayOrder,
  fetchOrder as fetchRazorpayOrder,
  fetchPayment,
  verifyPaymentSignature,
} from "@/lib/razorpay/client";
import {
  completeDraftOrder,
  createDraftOrder,
  getDraftOrder,
  type DraftOrderAddress,
} from "@/lib/shopify/admin";

/**
 * Razorpay Standard Checkout → Shopify order.
 *
 * The Shopify draft order IS the persistence layer for this flow — there is
 * no database in this app, and a draft order already holds everything a
 * pending checkout needs (line items, address, authoritative total) plus a
 * `status` Shopify tracks for us. So:
 *
 *   1. `startCheckout` creates the draft order FIRST, using the server's own
 *      cart (never a client-sent amount), then opens a Razorpay order for
 *      that exact total and tucks the draft order id into the Razorpay
 *      order's `notes`.
 *   2. `completePayment` is the one place either the frontend success
 *      callback or the webhook completes a payment. It reads the draft
 *      order id back out of the RAZORPAY order (the trusted side, not
 *      whatever the client claims), and short-circuits if that draft order
 *      is already completed — which is what makes a retry, a webhook,
 *      and a page refresh all safe to call this twice.
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

export interface CheckoutCustomer {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CheckoutAddress {
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
}

export interface StartCheckoutResult {
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  draftOrderId: string;
}

const MIN_AMOUNT_PAISE = 100; // Razorpay's own floor: ₹1.

export async function startCheckout(
  customer: CheckoutCustomer,
  shippingAddress: CheckoutAddress,
): Promise<StartCheckoutResult> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  if (!keyId) {
    throw new CheckoutError("Razorpay is not configured.", 500);
  }

  const cart = await getCart();
  if (!cart || cart.lines.length === 0) {
    throw new CheckoutError("Your cart is empty.", 400);
  }

  const address: DraftOrderAddress = {
    firstName: customer.firstName,
    lastName: customer.lastName,
    address1: shippingAddress.address1,
    address2: shippingAddress.address2,
    city: shippingAddress.city,
    province: shippingAddress.province,
    zip: shippingAddress.zip,
    country: shippingAddress.country,
    phone: customer.phone,
  };

  const draftOrder = await createDraftOrder({
    email: customer.email,
    lineItems: cart.lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
    })),
    shippingAddress: address,
    tags: ["razorpay"],
    note: `Razorpay Standard Checkout — cart ${cart.id}`,
  });

  // Shopify's totalPrice is the number that matters — it includes tax and
  // shipping Shopify computed, which the cart's client-side subtotal does
  // not. Razorpay wants integer paise.
  const amountPaise = Math.round(Number(draftOrder.totalPrice) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < MIN_AMOUNT_PAISE) {
    throw new CheckoutError(
      `Order total (${draftOrder.totalPrice}) is below the minimum payable amount.`,
      400,
    );
  }

  const razorpayOrder = await createRazorpayOrder({
    amountPaise,
    currency: draftOrder.currencyCode,
    receipt: draftOrder.name,
    notes: { draftOrderId: draftOrder.id },
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amountPaise,
    currency: razorpayOrder.currency,
    keyId,
    draftOrderId: draftOrder.id,
  };
}

export interface CompletePaymentResult {
  orderName: string;
  alreadyCompleted: boolean;
}

export interface VerifyAndCompleteInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
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
  return completePayment(input.razorpayOrderId, input.razorpayPaymentId);
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
): Promise<CompletePaymentResult> {
  // The draft order id comes from Razorpay's own record of the order, not
  // from the request body — the client has no legitimate reason to know or
  // control which draft order a payment resolves to.
  const razorpayOrder = await fetchRazorpayOrder(razorpayOrderId);
  const draftOrderId = razorpayOrder.notes.draftOrderId;
  if (!draftOrderId) {
    throw new CheckoutError(
      "This Razorpay order has no associated Shopify draft order.",
      400,
    );
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

  const existing = await getDraftOrder(draftOrderId);
  if (!existing) {
    throw new CheckoutError("Draft order no longer exists.", 400);
  }

  // Idempotency: a retry, the webhook, and the frontend callback all land
  // here, and only the first one should actually complete the draft order.
  if (existing.status === "COMPLETED") {
    return { orderName: existing.order?.name ?? existing.name, alreadyCompleted: true };
  }

  const completed = await completeDraftOrder(draftOrderId);
  return {
    orderName: completed.order?.name ?? completed.name,
    alreadyCompleted: false,
  };
}
