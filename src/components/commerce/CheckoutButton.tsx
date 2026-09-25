"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartProvider";

/**
 * Routes the buyer to /checkout, where Razorpay Standard Checkout collects
 * payment and the order is created in Shopify server-side once that payment
 * is verified. See src/lib/checkout/service.ts for the full flow — no card
 * data passes through this application.
 */
export function CheckoutButton({ className = "" }: { className?: string }) {
  const { count, isPending } = useCart();

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

  return (
    <Link
      href="/checkout"
      aria-disabled={isPending}
      className={`p1-btn p1-btn--primary w-full justify-center ${className}`.trim()}
    >
      {isPending ? "Updating…" : "Checkout"}
    </Link>
  );
}
