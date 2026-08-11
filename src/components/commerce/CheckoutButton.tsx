"use client";

import { useCart } from "@/lib/cart/CartProvider";

/**
 * Checkout is Shopify's job.
 *
 * Until the store is connected there is no checkout URL to send anyone to,
 * so the button states that plainly instead of pretending to work. Set
 * NEXT_PUBLIC_CHECKOUT_URL (or return Shopify's `cart.checkoutUrl` here in
 * Phase 5) to activate it.
 */
export function CheckoutButton({ className = "" }: { className?: string }) {
  const { count } = useCart();
  const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL;
  const disabled = count === 0 || !checkoutUrl;

  if (checkoutUrl && count > 0) {
    return (
      <a
        href={checkoutUrl}
        className={`p1-btn p1-btn--primary w-full justify-center ${className}`.trim()}
      >
        Checkout
      </a>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled}
        className="p1-btn p1-btn--primary w-full justify-center"
      >
        Checkout
      </button>
      {count > 0 && !checkoutUrl ? (
        <p className="p1-mono mt-3 normal-case tracking-[0.04em] text-[rgba(230,230,230,0.45)]">
          Checkout opens when the Shopify store goes live.
        </p>
      ) : null}
    </div>
  );
}
