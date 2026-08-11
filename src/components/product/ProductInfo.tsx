import Link from "next/link";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { availabilityLabel, priceLabel } from "@/lib/format";
import type { Product } from "@/types/product";

/** Identity, price, availability and the commerce controls for one product. */
export function ProductInfo({ product }: { product: Product }) {
  const status = availabilityLabel(product);
  const hasPrice = typeof product.price === "number";

  return (
    <div className="flex flex-col">
      <div className="p1-mono flex flex-wrap items-center gap-x-4 gap-y-2 text-[rgba(230,230,230,0.45)]">
        <Link
          href={`/products?category=${product.category.toLowerCase()}`}
          className="text-[rgba(230,230,230,0.45)] hover:text-signal"
        >
          {product.category}
        </Link>
        {product.sku ? <span>SKU {product.sku}</span> : null}
        {status ? (
          <span
            style={{
              color:
                product.availability?.status === "in-stock"
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
        <div className="p1-mono mt-5 text-[rgba(230,230,230,0.55)]">
          {product.specLine}
        </div>
      ) : null}

      {product.description ? (
        <p className="p1-body mt-7 max-w-[54ch]">{product.description}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-baseline gap-5 border-t border-hairline pt-6">
        <span className="font-display text-[26px] font-medium text-signal">
          {priceLabel(product)}
        </span>
        {hasPrice && product.compareAtPrice ? (
          <span className="font-mono text-sm text-[rgba(230,230,230,0.4)] line-through">
            {priceLabel({ ...product, price: product.compareAtPrice })}
          </span>
        ) : null}
        {!hasPrice ? (
          <span className="p1-mono text-[rgba(230,230,230,0.45)]">
            Price on enquiry
          </span>
        ) : null}
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <AddToCartButton product={product} />
        <Link
          href={`/contact?enquiry=product&product=${product.handle}`}
          className="p1-btn p1-btn--outline"
        >
          Talk to an engineer
        </Link>
      </div>

      {product.documents && product.documents.length > 0 ? (
        <div className="mt-10 border-t border-hairline pt-6">
          <div className="p1-mono mb-4 text-[rgba(230,230,230,0.45)]">
            Documents
          </div>
          <div className="flex flex-col gap-3">
            {product.documents.map((doc) => (
              <a key={doc.url} href={doc.url} className="p1-link self-start">
                {doc.label} ↓
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
