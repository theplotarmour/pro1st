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
 * The single product card. Used by the homepage grid, Arsenal, the gallery,
 * related products and search — there is no second implementation.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw",
}: ProductCardProps) {
  const image = product.images[0];
  // Only flag a card when the buyer can't buy — an "In stock" badge on every
  // tile is noise, but a sold-out one changes the decision.
  const flag =
    product.availability.status === "in-stock"
      ? null
      : availabilityLabel(product);

  return (
    <article className="group relative flex flex-col border-b border-hairline pb-5">
      <div
        data-p1-media
        className="relative mb-[18px] aspect-square overflow-hidden border border-hairline bg-panel"
      >
        <div className="absolute inset-0 transition-transform duration-[420ms] ease-signal group-hover:scale-[1.04] motion-reduce:transform-none">
          {image ? (
            <Media
              src={image.src}
              alt={image.alt || product.title}
              sizes={sizes}
              priority={priority}
            />
          ) : (
            <div className="grid h-full place-items-center">
              <span className="p1-mono text-[rgba(230,230,230,0.3)]">
                No image
              </span>
            </div>
          )}
        </div>

        {flag ? (
          <Badge className="absolute left-3 top-3 z-20">{flag}</Badge>
        ) : null}

        <AddToCartButton
          product={product}
          variant="ash"
          className="absolute inset-x-3 bottom-3 z-20 translate-y-2 py-[11px] text-[10px] opacity-0 transition-[opacity,transform] duration-300 ease-signal group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
        />
      </div>

      <div className="p1-mono text-[rgba(230,230,230,0.45)]">
        {product.category}
      </div>

      <h3 className="m-0 mt-2.5 font-display text-[17px] font-medium leading-[1.25] tracking-[-0.01em] text-white">
        <Link
          href={`/products/${product.handle}`}
          className="text-white after:absolute after:inset-0 after:z-10 after:content-[''] hover:text-signal"
        >
          {product.title}
        </Link>
      </h3>

      {product.specLine ? (
        <div className="p1-mono mt-2 translate-y-1.5 tracking-[0.06em] text-[rgba(230,230,230,0.5)] opacity-0 transition-[opacity,transform] duration-300 ease-signal group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          {product.specLine}
        </div>
      ) : null}

      <div className="mt-3.5 font-display text-[17px] font-medium text-signal">
        {priceLabel(product)}
      </div>

      <span
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-signal transition-transform duration-[420ms] ease-signal group-hover:scale-x-100"
      />
    </article>
  );
}
