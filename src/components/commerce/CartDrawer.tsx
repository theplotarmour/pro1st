"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/CartProvider";
import { CartItem } from "./CartItem";
import { CheckoutButton } from "./CheckoutButton";

export function CartDrawer() {
  const { lines, count, subtotal, currency, isOpen, close } = useCart();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <>
      <div
        onClick={close}
        aria-hidden="true"
        className="fixed inset-0 z-[140] bg-[rgba(13,13,15,0.6)] backdrop-blur-lg transition-opacity duration-[420ms] ease-signal"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      <aside
        ref={panelRef}
        aria-label="Cart"
        aria-hidden={!isOpen}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-[141] flex w-[min(420px,100vw)] flex-col border-l border-hairline bg-ink transition-transform duration-[420ms] ease-signal"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-center justify-between border-b border-hairline p-6">
          <span className="p1-mono text-[rgba(230,230,230,0.6)]">
            Cart — {count} {count === 1 ? "item" : "items"}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="p1-mono cursor-pointer border-0 bg-transparent text-ash hover:text-signal"
          >
            Close ✕
          </button>
        </div>

        <div aria-live="polite" className="flex-1 overflow-y-auto px-6 py-2">
          {lines.length === 0 ? (
            <p className="p1-mono py-16 text-center text-[rgba(230,230,230,0.35)]">
              Your cart is empty
            </p>
          ) : (
            lines.map((line) => (
              <CartItem key={line.productId} line={line} />
            ))
          )}
        </div>

        <div className="border-t border-hairline p-6">
          <div className="p1-mono mb-5 flex justify-between text-[rgba(230,230,230,0.6)]">
            <span>Subtotal · incl. GST</span>
            <span className="text-signal">
              {formatPrice(subtotal, currency)}
            </span>
          </div>
          <CheckoutButton />
          {lines.length > 0 ? (
            <Link
              href="/cart"
              onClick={close}
              className="p1-mono mt-4 block text-center text-[rgba(230,230,230,0.5)] hover:text-signal"
            >
              View full cart
            </Link>
          ) : (
            <Link
              href="/products"
              onClick={close}
              className="p1-mono mt-4 block text-center text-[rgba(230,230,230,0.5)] hover:text-signal"
            >
              Browse the catalogue
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
