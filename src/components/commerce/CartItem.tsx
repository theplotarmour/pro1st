"use client";

import Link from "next/link";
import { Media } from "@/components/ui/Media";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/CartProvider";
import type { CartLine } from "@/types/product";

interface CartItemProps {
  line: CartLine;
  /**
   * `drawer` is the condensed row, `page` the roomier one. Both carry the
   * full quantity and remove controls — the drawer used to print a static
   * "Qty 2", which meant the only way to change a quantity or drop a line was
   * to leave the drawer for /cart. A cart you cannot edit is a dead end.
   */
  layout?: "drawer" | "page";
}

export function CartItem({ line, layout = "drawer" }: CartItemProps) {
  const { setQuantity, remove, isPending } = useCart();
  const lineTotal = line.price * line.quantity;
  const compact = layout === "drawer";
  const step = compact ? "h-7 w-7 text-xs" : "h-8 w-8";

  // Shopify tells us the real ceiling; never let a buyer request more than
  // the store can actually ship.
  const atMax =
    typeof line.quantityAvailable === "number" &&
    line.quantity >= line.quantityAvailable;

  return (
    <div className="grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-hairline py-5">
      <Link
        href={`/products/${line.handle}`}
        className="relative aspect-square overflow-hidden border border-hairline bg-panel"
        tabIndex={-1}
        aria-hidden="true"
      >
        {line.image ? (
          <Media src={line.image.src} alt="" sizes="64px" />
        ) : null}
      </Link>

      <div className="min-w-0">
        <Link
          href={`/products/${line.handle}`}
          className="block font-display text-sm font-medium leading-[1.3] text-strong hover:text-signal"
        >
          {line.title}
        </Link>

        {line.variantTitle ? (
          <div className="p1-mono mt-1 text-[10px] text-soft">
            {line.variantTitle}
          </div>
        ) : null}

        {!line.availableForSale ? (
          <div className="p1-mono mt-1.5 text-[10px] text-signal">
            Currently unavailable
          </div>
        ) : null}

        <div
          className={`flex items-center ${compact ? "mt-2 gap-2" : "mt-3 gap-3"}`}
        >
          <div
            className="flex items-center border border-hairline"
            role="group"
            aria-label={`Quantity for ${line.title}`}
          >
            {/*
              At quantity 1 the minus key removes the line rather than
              stepping to 0 — Shopify treats a 0 quantity as a delete anyway,
              and a decrement button that silently deletes without saying so
              is worse than one labelled for it.
            */}
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                line.quantity <= 1
                  ? remove(line.id)
                  : setQuantity(line.id, line.quantity - 1)
              }
              aria-label={
                line.quantity <= 1
                  ? `Remove ${line.title} from cart`
                  : `Decrease quantity of ${line.title}`
              }
              className={`grid ${step} cursor-pointer place-items-center border-0 bg-transparent text-ash hover:text-signal disabled:opacity-40`}
            >
              −
            </button>
            <span
              className={`text-center font-mono ${compact ? "w-7 text-xs" : "w-8 text-xs"}`}
              aria-live="polite"
            >
              {line.quantity}
            </span>
            <button
              type="button"
              disabled={isPending || atMax}
              onClick={() => setQuantity(line.id, line.quantity + 1)}
              aria-label={`Increase quantity of ${line.title}`}
              className={`grid ${step} cursor-pointer place-items-center border-0 bg-transparent text-ash hover:text-signal disabled:opacity-40`}
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => remove(line.id)}
            aria-label={`Remove ${line.title} from cart`}
            className={`p1-mono cursor-pointer border-0 bg-transparent text-soft hover:text-signal disabled:opacity-40 ${
              compact ? "text-[10px]" : ""
            }`}
          >
            Remove
          </button>
        </div>

        {atMax ? (
          <p className="p1-mono mt-2 normal-case tracking-[0.04em] text-faint">
            Only {line.quantityAvailable} in stock.
          </p>
        ) : null}
      </div>

      <div className="text-right font-display text-sm font-medium text-signal">
        {formatPrice(lineTotal, line.currency)}
      </div>
    </div>
  );
}
