"use client";

import { useCart } from "@/lib/cart/CartProvider";

/**
 * Hands the buyer to Shopify.
 *
 * `checkoutUrl` comes straight from the Shopify cart, so payment, taxes,
 * shipping and the order all happen on Shopify's infrastructure. This
 * application never sees a card number.
 */
export function CheckoutButton({ className = "" }: { className?: string }) {
  const { count, checkoutUrl, isPending } = useCart();

  if (count === 0 || !checkoutUrl) {
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
    <a
      href={checkoutUrl}
      aria-disabled={isPending}
      className={`p1-btn p1-btn--primary w-full justify-center ${className}`.trim()}
    >
      {isPending ? "Updating…" : "Checkout"}
    </a>
  );
}
