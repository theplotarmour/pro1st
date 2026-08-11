"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import {
  availabilityLabel,
  categorySlug,
  defaultVariant,
  formatPrice,
  hasRealOptions,
  priceLabel,
} from "@/lib/format";
import type { Product } from "@/types/product";

/** Identity, price, availability, variant choice and commerce controls. */
export function ProductInfo({ product }: { product: Product }) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    () => defaultVariant(product)?.id,
  );

  const selected =
    product.variants.find((variant) => variant.id === selectedId) ??
    defaultVariant(product);

  const showOptions = hasRealOptions(product);
  const status = availabilityLabel(product);
  const categoryHref = product.categoryHandle
    ? `/products?category=${product.categoryHandle}`
    : `/products?category=${categorySlug(product.category)}`;

  // Price follows the selected variant; the range minimum is only a fallback.
  const price = selected?.price ?? product.price;
  const compareAt = selected?.compareAtPrice ?? product.compareAtPrice;
  const currency = selected?.currency ?? product.currency;
  const sku = selected?.sku ?? product.sku;

  return (
    <div className="flex flex-col">
      <div className="p1-mono flex flex-wrap items-center gap-x-4 gap-y-2 text-soft">
        {product.category ? (
          <Link
            href={categoryHref}
            className="text-soft hover:text-signal"
          >
            {product.category}
          </Link>
        ) : null}
        {sku ? <span>SKU {sku}</span> : null}
        {status ? (
          <span
            style={{
              color:
                product.availability.status === "in-stock"
                  ? "var(--p1-signal)"
                  : undefined,
            }}
          >
            {status}
          </span>
        ) : null}
      </div>

      <h1 className="p1-h3 mt-5">{product.title}</h1>

      {product.specLine ? (
        <div className="p1-mono mt-5 text-muted">
          {product.specLine}
        </div>
      ) : null}

      {product.description ? (
        <p className="p1-body mt-7 max-w-[54ch] whitespace-pre-line">
          {product.description}
        </p>
      ) : null}

      {showOptions ? (
        <div className="mt-8 flex flex-col gap-5">
          {product.options.map((option) => (
            <fieldset key={option.name} className="m-0 border-0 p-0">
              <legend className="p1-label">{option.name}</legend>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  // Pick the variant this value resolves to, so an
                  // unavailable combination is visibly unavailable.
                  const match = product.variants.find((variant) =>
                    variant.selectedOptions.some(
                      (o) => o.name === option.name && o.value === value,
                    ),
                  );
                  const isActive = selected?.selectedOptions.some(
                    (o) => o.name === option.name && o.value === value,
                  );
                  const sellable = match?.availableForSale ?? false;

                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!match}
                      onClick={() => match && setSelectedId(match.id)}
                      aria-pressed={isActive}
                      className={`p1-mono cursor-pointer border px-4 py-2.5 transition-[border-color,color,background-color] duration-[120ms] ease-signal disabled:cursor-not-allowed disabled:opacity-40 ${
                        isActive
                          ? "border-signal bg-signal text-ink"
                          : "border-hairline text-body hover:border-signal hover:text-signal"
                      }`}
                    >
                      {value}
                      {match && !sellable ? " · sold out" : ""}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-baseline gap-5 border-t border-hairline pt-6">
        <span className="font-display text-[26px] font-medium text-signal">
          {typeof price === "number"
            ? formatPrice(price, currency)
            : priceLabel(product)}
        </span>
        {typeof price === "number" &&
        typeof compareAt === "number" &&
        compareAt > price ? (
          <span className="font-mono text-sm text-faint line-through">
            {formatPrice(compareAt, currency)}
          </span>
        ) : null}
        {typeof price !== "number" ? (
          <span className="p1-mono text-soft">
            Price on enquiry
          </span>
        ) : null}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <AddToCartButton product={product} variantId={selected?.id} />
        <Link
          href={`/contact?enquiry=product&product=${product.handle}`}
          className="p1-btn p1-btn--outline"
        >
          Talk to an engineer
        </Link>
      </div>

      {product.documents && product.documents.length > 0 ? (
        <div className="mt-10 border-t border-hairline pt-6">
          <div className="p1-mono mb-4 text-soft">
            Documents
          </div>
          <div className="flex flex-col gap-3">
            {product.documents.map((doc) => (
              <a
                key={doc.url}
                href={doc.url}
                className="p1-link self-start"
                target="_blank"
                rel="noopener noreferrer"
              >
                {doc.label} ↓
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
