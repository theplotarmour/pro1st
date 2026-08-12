"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { Media } from "@/components/ui/Media";
import { availabilityLabel, priceLabel } from "@/lib/format";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  /** Priority-load the first row on the homepage / gallery. */
  priority?: boolean;
  sizes?: string;
}

/**
 * The single product card, used by every grid on the site.
 *
 * Price, specification line and the add-to-cart control are permanently
 * visible. They used to be revealed on hover, which meant that on any touch
 * device — the majority of this market — a shopper could not see the spec
 * without opening the product, and could not add to cart from a grid at all.
 * Hover is a progressive enhancement here, never the only route to an action.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw",
}: ProductCardProps) {
  const image = product.images[0];
  const flag =
    product.availability.status === "in-stock"
      ? null
      : availabilityLabel(product);

  return (
    <article className="group relative flex h-full flex-col">
      <div
        data-p1-media
        className="relative mb-5 aspect-square overflow-hidden border border-hairline bg-panel"
      >
        <div className="absolute inset-0 transition-transform duration-[520ms] ease-signal group-hover:scale-[1.04] motion-reduce:transform-none">
          {image ? (
            <Media
              src={image.src}
              alt={image.alt || product.title}
              sizes={sizes}
              priority={priority}
            />
          ) : (
            <div className="grid h-full place-items-center">
              <span className="p1-mono text-faint">No image</span>
            </div>
          )}
        </div>

        {flag ? (
          <Badge className="absolute left-3 top-3 z-20">{flag}</Badge>
        ) : null}
      </div>

      <div className="p1-mono text-faint">{product.category}</div>

      <h3 className="m-0 mt-2 font-display text-[17px] font-medium leading-[1.3] tracking-[-0.01em] text-strong">
        <Link
          href={`/products/${product.handle}`}
          className="text-strong after:absolute after:inset-0 after:z-10 after:content-[''] hover:text-signal"
        >
          {product.title}
        </Link>
      </h3>

      {/* Always rendered. A spec line a buyer has to hover to read is a spec
          line most buyers never read. */}
      {product.specLine ? (
        <div className="p1-mono mt-2 tracking-[0.06em] text-soft">
          {product.specLine}
        </div>
      ) : null}

      {/* Price and action pinned to the bottom so cards in a row align. */}
      <div className="mt-auto pt-4">
        <div className="font-display text-[19px] font-medium text-signal">
          {priceLabel(product)}
        </div>
        <AddToCartButton
          product={product}
          variant="ash"
          className="relative z-20 mt-3 w-full py-3 text-[10px]"
        />
      </div>
    </article>
  );
}
