"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/CartProvider";
import { CartItem } from "./CartItem";
import { CheckoutButton } from "./CheckoutButton";

/** Full-page cart. Same Shopify cart as the drawer, more room to edit. */
export function CartView() {
  const { lines, count, subtotal, currency, clear, isReady, isPending, error } =
    useCart();

  // Nothing renders until the Shopify cart has been read, so the empty state
  // never flashes for someone who has items.
  if (!isReady) {
    return (
      <p className="p1-mono text-[rgba(230,230,230,0.35)]">Loading cart…</p>
    );
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

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="p1-mono mb-8 border border-signal bg-[rgba(255,106,0,0.08)] px-5 py-4 normal-case tracking-[0.04em] text-signal"
        >
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[7fr_5fr] lg:gap-20">
        <div aria-busy={isPending} style={{ opacity: isPending ? 0.6 : 1 }}>
          <div className="p1-mono mb-2 flex items-center justify-between text-[rgba(230,230,230,0.45)]">
            <span>
              {count} {count === 1 ? "item" : "items"}
            </span>
            <button
              type="button"
              onClick={clear}
              disabled={isPending}
              className="cursor-pointer border-0 bg-transparent text-[rgba(230,230,230,0.45)] hover:text-signal disabled:opacity-40"
            >
              Clear cart
            </button>
          </div>
          <div className="border-t border-hairline">
            {lines.map((line) => (
              <CartItem key={line.id} line={line} layout="page" />
            ))}
          </div>
        </div>

        <aside
          aria-label="Order summary"
          className="border border-hairline bg-panel p-6 lg:sticky lg:top-[104px]"
        >
          <h2 className="p1-mono mb-6 text-[rgba(230,230,230,0.6)]">Summary</h2>
          <div className="p1-mono flex justify-between border-t border-hairline py-4 text-[rgba(230,230,230,0.6)]">
            <span>Subtotal</span>
            <span className="text-signal">
              {formatPrice(subtotal, currency)}
            </span>
          </div>
          <p className="p1-mono mb-6 normal-case tracking-[0.04em] text-[rgba(230,230,230,0.4)]">
            Taxes and shipping are calculated by Shopify at checkout.
          </p>
          <CheckoutButton />
        </aside>
      </div>
    </>
  );
}
