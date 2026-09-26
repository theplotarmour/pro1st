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

export interface RazorpayLineItem {
  sku: string;
  variantId: string;
  /** Minor units, e.g. paise for INR. */
  pricePaise: number;
  quantity: number;
  name: string;
  description?: string;
  imageUrl?: string;
  productUrl?: string;
}

export interface CreateRazorpayOrderInput {
  /** Minor units — paise for INR. Razorpay requires >= 100 (₹1). */
  amountPaise: number;
  currency: string;
  /** Shown in the Razorpay dashboard; ties the order back to our own record. */
  receipt: string;
  /** Small key/value strings Razorpay stores alongside the order and echoes back. */
  notes: Record<string, string>;
  /**
   * Magic Checkout line items. Their presence is what puts the order in
   * Magic Checkout mode — omitting them (or omitting the total) silently
   * downgrades the order back to Standard Checkout, per Razorpay's own docs.
   */
  lineItems?: RazorpayLineItem[];
}

/** All fields optional — the SDK's own type is a Partial<> here; a genuinely complete address is validated by the caller, not assumed by this shape. */
export interface RazorpayShippingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  notes: Record<string, string>;
  /** Populated only once Magic Checkout has collected it — absent before payment. */
  customerDetails?: {
    name?: string | null;
    email?: string | null;
    contact?: string | null;
    shippingAddress?: RazorpayShippingAddress | null;
  };
}

function mapOrder(order: {
  id: string;
  amount: string | number;
  currency: string;
  notes?: unknown;
  customer_details?: {
    name?: string | null;
    email?: string | null;
    contact?: string | null;
    shipping_address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      zipcode?: string | number;
      country?: string;
    } | null;
  };
}): RazorpayOrder {
  const address = order.customer_details?.shipping_address;
  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    notes: (order.notes as Record<string, string>) ?? {},
    customerDetails: order.customer_details
      ? {
          name: order.customer_details.name,
          email: order.customer_details.email,
          contact: order.customer_details.contact,
          shippingAddress: address
            ? {
                line1: address.line1,
                line2: address.line2,
                city: address.city,
                state: address.state,
                zipcode: address.zipcode !== undefined ? String(address.zipcode) : undefined,
                country: address.country,
              }
            : null,
        }
      : undefined,
  };
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
    ...(input.lineItems
      ? {
          line_items_total: input.amountPaise,
          line_items: input.lineItems.map((item) => ({
            type: "e-commerce",
            sku: item.sku,
            variant_id: item.variantId,
            price: String(item.pricePaise),
            offer_price: String(item.pricePaise),
            tax_amount: 0,
            quantity: item.quantity,
            name: item.name,
            description: item.description ?? item.name,
            weight: "0",
            dimensions: { length: "0", width: "0", height: "0" },
            image_url: item.imageUrl ?? "",
            product_url: item.productUrl ?? "",
          })),
        }
      : {}),
  });

  return mapOrder(order);
}

/**
 * Reads back a Razorpay order — used both to recover `notes.*` from the
 * trusted side, and after payment to read the address Magic Checkout
 * collected (`customerDetails.shippingAddress`), which this app never saw.
 */
export async function fetchOrder(orderId: string): Promise<RazorpayOrder> {
  const order = await getClient().orders.fetch(orderId);
  return mapOrder(order);
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
