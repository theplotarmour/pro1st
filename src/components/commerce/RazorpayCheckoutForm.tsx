"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/CartProvider";

/**
 * Address + pay form. On submit:
 *   1. POST /api/checkout/create-order — builds the Shopify draft order and
 *      a matching Razorpay order (src/lib/checkout/service.ts).
 *   2. Load checkout.js, open the Razorpay modal against that order.
 *   3. On success, POST /api/checkout/verify-payment with the three fields
 *      Razorpay hands back, then clear the cart and go to /checkout/success.
 *
 * Errors are state, never a thrown exception into an error boundary — same
 * pattern as CartProvider and ContactForm.
 */

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open(): void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load Razorpay checkout."));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

type Stage = "idle" | "creating-order" | "awaiting-payment" | "verifying";

export function RazorpayCheckoutForm() {
  const router = useRouter();
  const { lines, count, subtotal, currency, clear, isReady } = useCart();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = stage !== "idle";

  if (!isReady) {
    return <p className="p1-mono text-faint">Loading cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        message="Your cart is empty."
        action={
          <Link href="/products" className="p1-btn p1-btn--primary">
            Browse the catalogue
          </Link>
        }
      />
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const customer = {
      email: String(form.get("email") ?? "").trim(),
      firstName: String(form.get("firstName") ?? "").trim(),
      lastName: String(form.get("lastName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
    };
    const shippingAddress = {
      address1: String(form.get("address1") ?? "").trim(),
      address2: String(form.get("address2") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      province: String(form.get("province") ?? "").trim(),
      zip: String(form.get("zip") ?? "").trim(),
      country: String(form.get("country") ?? "India"),
    };

    try {
      setStage("creating-order");
      const createRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, shippingAddress }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error ?? "Could not start checkout.");
      }

      await loadRazorpayScript();
      setStage("awaiting-payment");

      const razorpay = new window.Razorpay!({
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency,
        order_id: createData.orderId,
        name: "PRO1ST",
        description: `${count} item${count === 1 ? "" : "s"}`,
        prefill: {
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email,
          contact: customer.phone || undefined,
        },
        theme: { color: "#ff6a00" },
        handler: (response) => {
          void verifyAndFinish(response);
        },
        modal: {
          ondismiss: () => {
            setStage("idle");
            setError("Payment cancelled. Your cart is unchanged.");
          },
        },
      });

      razorpay.open();
    } catch (err) {
      setStage("idle");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function verifyAndFinish(response: RazorpaySuccessResponse) {
    setStage("verifying");
    try {
      const verifyRes = await fetch("/api/checkout/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(
          verifyData.error ?? "Payment could not be verified.",
        );
      }

      // clear() is fire-and-forget (CartProvider's own pattern — it runs in
      // a transition, not a promise) — navigate immediately after firing it.
      clear();
      router.push(
        `/checkout/success?order=${encodeURIComponent(verifyData.orderName ?? "")}`,
      );
    } catch (err) {
      setStage("idle");
      setError(
        err instanceof Error
          ? `${err.message} Your payment may have gone through — contact us with your payment ID before paying again.`
          : "Could not confirm your payment.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <section
        aria-label="Order summary"
        className="border border-hairline bg-panel p-6"
      >
        <h2 className="p1-mono mb-4 text-muted">
          {count} {count === 1 ? "item" : "items"}
        </h2>
        <ul className="flex flex-col gap-2">
          {lines.map((line) => (
            <li
              key={line.id}
              className="p1-mono flex justify-between normal-case tracking-[0.04em] text-soft"
            >
              <span>
                {line.title} × {line.quantity}
              </span>
              <span>{formatPrice(line.price * line.quantity, line.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="p1-mono mt-4 flex justify-between border-t border-hairline pt-4 text-muted">
          <span>Subtotal</span>
          <span className="text-signal">{formatPrice(subtotal, currency)}</span>
        </div>
        <p className="p1-mono mt-2 normal-case tracking-[0.04em] text-faint">
          Tax and shipping are calculated on the next step and shown before you pay.
        </p>
      </section>

      <fieldset className="m-0 border-0 p-0" disabled={isSubmitting}>
        <legend className="p1-label mb-4">Contact</legend>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="checkout-firstName" className="p1-label">
              First name
            </label>
            <input
              id="checkout-firstName"
              name="firstName"
              required
              autoComplete="given-name"
              className="p1-field"
            />
          </div>
          <div>
            <label htmlFor="checkout-lastName" className="p1-label">
              Last name
            </label>
            <input
              id="checkout-lastName"
              name="lastName"
              required
              autoComplete="family-name"
              className="p1-field"
            />
          </div>
          <div>
            <label htmlFor="checkout-email" className="p1-label">
              Email
            </label>
            <input
              id="checkout-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="p1-field"
            />
          </div>
          <div>
            <label htmlFor="checkout-phone" className="p1-label">
              Phone
            </label>
            <input
              id="checkout-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="p1-field"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0" disabled={isSubmitting}>
        <legend className="p1-label mb-4">Shipping address</legend>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="checkout-address1" className="p1-label">
              Address
            </label>
            <input
              id="checkout-address1"
              name="address1"
              required
              autoComplete="address-line1"
              className="p1-field"
            />
          </div>
          <div>
            <label htmlFor="checkout-address2" className="p1-label">
              Apartment, suite, etc. <span className="normal-case">(optional)</span>
            </label>
            <input
              id="checkout-address2"
              name="address2"
              autoComplete="address-line2"
              className="p1-field"
            />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="checkout-city" className="p1-label">
                City
              </label>
              <input
                id="checkout-city"
                name="city"
                required
                autoComplete="address-level2"
                className="p1-field"
              />
            </div>
            <div>
              <label htmlFor="checkout-province" className="p1-label">
                State
              </label>
              <input
                id="checkout-province"
                name="province"
                required
                autoComplete="address-level1"
                className="p1-field"
              />
            </div>
            <div>
              <label htmlFor="checkout-zip" className="p1-label">
                PIN code
              </label>
              <input
                id="checkout-zip"
                name="zip"
                required
                autoComplete="postal-code"
                className="p1-field"
              />
            </div>
          </div>
          <input type="hidden" name="country" value="India" />
        </div>
      </fieldset>

      {error ? (
        <p
          role="alert"
          className="p1-mono border border-signal bg-[rgba(255,106,0,0.08)] px-5 py-4 normal-case tracking-[0.04em] text-signal"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="p1-btn p1-btn--primary w-full justify-center sm:w-auto"
      >
        {stage === "creating-order" && "Preparing order…"}
        {stage === "awaiting-payment" && "Waiting for payment…"}
        {stage === "verifying" && "Confirming payment…"}
        {stage === "idle" && `Pay ${formatPrice(subtotal, currency)}`}
      </button>
    </form>
  );
}
