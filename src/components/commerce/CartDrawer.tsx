"use client";

import Link from "next/link";
import { useRef } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/CartProvider";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { CartItem } from "./CartItem";
import { CheckoutButton } from "./CheckoutButton";

export function CartDrawer() {
  const {
    lines,
    count,
    subtotal,
    currency,
    isOpen,
    isReady,
    isPending,
    error,
    close,
  } = useCart();
  const panelRef = useRef<HTMLElement>(null);

  useFocusTrap(panelRef, isOpen, { onClose: close });

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

      {/*
        The panel is unmounted from the a11y tree via `inert` when closed —
        `aria-hidden` alone would leave its buttons focusable, which is the
        classic screen-reader trap.
      */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        inert={!isOpen}
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
            className="p1-mono cursor-pointer border-0 bg-transparent text-ash hover:text-signal"
          >
            Close ✕
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="p1-mono border-b border-hairline bg-[rgba(255,106,0,0.08)] px-6 py-4 normal-case tracking-[0.04em] text-signal"
          >
            {error}
          </p>
        ) : null}

        <div
          aria-live="polite"
          aria-busy={isPending}
          className="flex-1 overflow-y-auto px-6 py-2"
        >
          {!isReady ? (
            <p className="p1-mono py-16 text-center text-[rgba(230,230,230,0.35)]">
              Loading cart…
            </p>
          ) : lines.length === 0 ? (
            <p className="p1-mono py-16 text-center text-[rgba(230,230,230,0.35)]">
              Your cart is empty
            </p>
          ) : (
            <div style={{ opacity: isPending ? 0.55 : 1 }}>
              {lines.map((line) => (
                <CartItem key={line.id} line={line} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-hairline p-6">
          <div className="p1-mono mb-5 flex justify-between text-[rgba(230,230,230,0.6)]">
            <span>Subtotal</span>
            <span className="text-signal">
              {formatPrice(subtotal, currency)}
            </span>
          </div>
          <p className="p1-mono mb-5 normal-case tracking-[0.04em] text-[rgba(230,230,230,0.4)]">
            Taxes and shipping are calculated at checkout.
          </p>
          <CheckoutButton />
          <Link
            href={lines.length > 0 ? "/cart" : "/products"}
            onClick={close}
            className="p1-mono mt-4 block text-center text-[rgba(230,230,230,0.5)] hover:text-signal"
          >
            {lines.length > 0 ? "View full cart" : "Browse the catalogue"}
          </Link>
        </div>
      </aside>
    </>
  );
}
