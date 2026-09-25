import "server-only";

import crypto from "node:crypto";
import Razorpay from "razorpay";

/**
 * Razorpay Standard Checkout — server-side calls only.
 *
 * `RAZORPAY_KEY_SECRET` never leaves this file. The public key
 * (`NEXT_PUBLIC_RAZORPAY_KEY_ID`) is a separate env var read directly by the
 * checkout form — this module never exports the secret in any shape.
 */

export class RazorpayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RazorpayConfigError";
  }
}

let cachedClient: Razorpay | null = null;

function getClient(): Razorpay {
  if (cachedClient) return cachedClient;

  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!key_id || !key_secret) {
    throw new RazorpayConfigError(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET — see .env.example.",
    );
  }

  cachedClient = new Razorpay({ key_id, key_secret });
  return cachedClient;
}

export interface CreateRazorpayOrderInput {
  /** Minor units — paise for INR. Razorpay requires >= 100 (₹1). */
  amountPaise: number;
  currency: string;
  /** Shown in the Razorpay dashboard; ties the order back to our own record. */
  receipt: string;
  /** Small key/value strings Razorpay stores alongside the order and echoes back. */
  notes: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  notes: Record<string, string>;
}

/** Creates the Razorpay order the checkout modal is opened against. */
export async function createOrder(
  input: CreateRazorpayOrderInput,
): Promise<RazorpayOrder> {
  const order = await getClient().orders.create({
    amount: input.amountPaise,
    currency: input.currency,
    receipt: input.receipt,
    notes: input.notes,
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    notes: (order.notes as Record<string, string>) ?? {},
  };
}

/** Reads back a Razorpay order — used to recover `notes.draftOrderId` from the trusted side. */
export async function fetchOrder(orderId: string): Promise<RazorpayOrder> {
  const order = await getClient().orders.fetch(orderId);
  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    notes: (order.notes as Record<string, string>) ?? {},
  };
}

export interface RazorpayPayment {
  id: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
}

export async function fetchPayment(
  paymentId: string,
): Promise<RazorpayPayment> {
  const payment = await getClient().payments.fetch(paymentId);
  return {
    id: payment.id,
    orderId: String(payment.order_id),
    status: payment.status,
    amount: Number(payment.amount),
    currency: payment.currency,
  };
}

/**
 * HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET), timing-safe compare.
 * This is the frontend success callback's signature — proves the payment
 * response actually came from Razorpay, not a forged client call.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    throw new RazorpayConfigError("RAZORPAY_KEY_SECRET is not set.");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  return timingSafeEqualHex(expected, params.signature);
}

/**
 * HMAC-SHA256(raw request body, WEBHOOK_SECRET) — a different secret from
 * the payment signature above. Set in the Razorpay dashboard when the
 * webhook is registered.
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", params.secret)
    .update(params.rawBody)
    .digest("hex");

  return timingSafeEqualHex(expected, params.signature);
}

function timingSafeEqualHex(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
