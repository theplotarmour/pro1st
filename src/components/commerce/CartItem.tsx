"use client";

import Link from "next/link";
import { Media } from "@/components/ui/Media";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/CartProvider";
import type { CartLine } from "@/types/product";

interface CartItemProps {
  line: CartLine;
  /** `drawer` is the condensed row; `page` adds quantity controls. */
  layout?: "drawer" | "page";
}

export function CartItem({ line, layout = "drawer" }: CartItemProps) {
  const { setQuantity, remove } = useCart();
  const lineTotal = line.price * line.quantity;

  return (
    <div className="grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-hairline py-5">
      <Link
        href={`/products/${line.handle}`}
        className="relative aspect-square overflow-hidden border border-hairline bg-panel"
      >
        {line.image ? (
          <Media src={line.image.src} alt={line.image.alt} sizes="64px" />
        ) : null}
      </Link>

      <div className="min-w-0">
        <Link
          href={`/products/${line.handle}`}
          className="block font-display text-sm font-medium leading-[1.3] text-white hover:text-signal"
        >
          {line.title}
        </Link>

        {layout === "drawer" ? (
          <div className="p1-mono mt-1.5 text-[10px] tracking-[0.06em] text-[rgba(230,230,230,0.45)]">
            Qty {line.quantity}
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <div
              className="flex items-center border border-hairline"
              role="group"
              aria-label={`Quantity for ${line.title}`}
            >
              <button
                type="button"
                onClick={() => setQuantity(line.productId, line.quantity - 1)}
                aria-label={`Decrease quantity of ${line.title}`}
                className="grid h-8 w-8 cursor-pointer place-items-center border-0 bg-transparent text-ash hover:text-signal"
              >
                −
              </button>
              <span className="w-8 text-center font-mono text-xs">
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(line.productId, line.quantity + 1)}
                aria-label={`Increase quantity of ${line.title}`}
                className="grid h-8 w-8 cursor-pointer place-items-center border-0 bg-transparent text-ash hover:text-signal"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => remove(line.productId)}
              className="p1-mono cursor-pointer border-0 bg-transparent text-[rgba(230,230,230,0.45)] hover:text-signal"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="text-right font-display text-sm font-medium text-signal">
        {formatPrice(lineTotal, line.currency)}
      </div>
    </div>
  );
}
