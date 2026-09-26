"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartProvider";

/**
 * Opens Razorpay Magic Checkout directly — no address-form page. Magic
 * Checkout's own modal collects name/email/address itself, live, calling
 * this app's /api/checkout/magic/shipping and /magic/promotions endpoints
 * as the buyer types. See src/lib/checkout/service.ts for the full flow —
 * no card data passes through this application.
 */

declare global {
  interface Window {
    Razorpay?: new (options: MagicCheckoutOptions) => { open(): void };
  }
}

interface MagicCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  one_click_checkout: boolean;
  show_coupons: boolean;
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const MAGIC_CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/magic-checkout.js";

let scriptPromise: Promise<void> | null = null;

function loadMagicCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = MAGIC_CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load Razorpay checkout."));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export function CheckoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { count, isPending, close, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (count === 0) {
    return (
      <button
        type="button"
        disabled
        className={`p1-btn p1-btn--primary w-full justify-center ${className}`.trim()}
      >
        Checkout
      </button>
    );
  }

  async function startCheckout() {
    setError(null);
    setLoading(true);
    close(); // drop the drawer — the Magic Checkout modal is the new surface

    try {
      const createRes = await fetch("/api/checkout/create-order", { method: "POST" });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error ?? "Could not start checkout.");
      }

      await loadMagicCheckoutScript();

      const razorpay = new window.Razorpay!({
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency,
        order_id: createData.orderId,
        name: "PRO1ST",
        one_click_checkout: true,
        show_coupons: true,
        handler: (response) => {
          void verifyAndFinish(response);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      razorpay.open();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function verifyAndFinish(response: RazorpaySuccessResponse) {
    try {
      const verifyRes = await fetch("/api/checkout/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error ?? "Payment could not be verified.");
      }

      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(verifyData.orderName ?? "")}`);
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error
          ? `${err.message} Your payment may have gone through — contact us with your payment ID before paying again.`
          : "Could not confirm your payment.",
      );
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={isPending || loading}
        aria-disabled={isPending || loading}
        className={`p1-btn p1-btn--primary w-full justify-center ${className}`.trim()}
      >
        {loading ? "Opening checkout…" : isPending ? "Updating…" : "Checkout"}
      </button>
      {error ? (
        <p
          role="alert"
          className="p1-mono mt-3 normal-case tracking-[0.04em] text-signal"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
