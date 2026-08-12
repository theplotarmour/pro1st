"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart/CartProvider";
import { defaultVariant, formatPrice, isPurchasable } from "@/lib/format";
import type { Product } from "@/types/product";

/**
 * Bulk quick-order.
 *
 * Trade buyers specifying a venue order across a dozen models should not have
 * to open a dozen product pages. This is the whole catalogue as one editable
 * list: enter quantities, see the running total, add everything at once.
 *
 * It works today against the real Shopify cart. It needs no wholesale pricing
 * engine — tiered dealer pricing is a separate, merchant-side piece; this is
 * the ordering surface that will sit on top of it.
 */
export function BulkOrderTable({ products }: { products: Product[] }) {
  const { add, isPending } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const orderable = products.filter(isPurchasable);
    if (!term) return orderable;
    return orderable.filter((product) =>
      [product.title, product.sku ?? "", product.category]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [products, filter]);

  const selected = products.filter((p) => (quantities[p.id] ?? 0) > 0);
  const lineCount = selected.reduce(
    (sum, p) => sum + (quantities[p.id] ?? 0),
    0,
  );
  const subtotal = selected.reduce(
    (sum, p) => sum + (p.price ?? 0) * (quantities[p.id] ?? 0),
    0,
  );

  const setQty = (id: string, value: number) =>
    setQuantities((current) => ({ ...current, [id]: Math.max(0, value) }));

  const addAll = () => {
    for (const product of selected) {
      const variant = defaultVariant(product);
      if (variant) add(product, quantities[product.id] ?? 0, variant.id);
    }
    setQuantities({});
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <label className="sr-only" htmlFor="bulk-filter">
          Filter the order list
        </label>
        <input
          id="bulk-filter"
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter by name, SKU or category…"
          className="p1-field max-w-sm"
        />
        <span className="p1-mono text-faint">
          {rows.length} orderable {rows.length === 1 ? "SKU" : "SKUs"}
        </span>
      </div>

      <div className="overflow-x-auto border border-hairline">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline bg-panel">
              {["Product", "Category", "SKU", "Unit price", "Qty", "Line total"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="p1-mono px-4 py-3 font-normal text-soft"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => {
              const qty = quantities[product.id] ?? 0;
              const price = product.price ?? 0;
              return (
                <tr
                  key={product.id}
                  className="border-b border-hairline last:border-b-0"
                >
                  <td className="px-4 py-3 text-[14px] text-strong">
                    {product.title}
                  </td>
                  <td className="p1-mono px-4 py-3 text-faint">
                    {product.category}
                  </td>
                  <td className="p1-mono px-4 py-3 text-faint">
                    {product.sku ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-body">
                    {formatPrice(price, product.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={qty || ""}
                      onChange={(event) =>
                        setQty(product.id, Number(event.target.value) || 0)
                      }
                      aria-label={`Quantity for ${product.title}`}
                      className="p1-field w-20 px-2 py-1.5 text-center text-[13px]"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-signal">
                    {qty > 0 ? formatPrice(price * qty, product.currency) : "—"}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <span className="p1-mono text-faint">
                    Nothing matches that filter.
                  </span>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
        <div className="p1-mono text-soft">
          {lineCount} {lineCount === 1 ? "unit" : "units"} ·{" "}
          <span className="text-signal">{formatPrice(subtotal)}</span>
        </div>
        <button
          type="button"
          onClick={addAll}
          disabled={lineCount === 0 || isPending}
          className="p1-btn p1-btn--primary"
        >
          {isPending ? "Adding…" : `Add ${lineCount || ""} to cart`.trim()}
        </button>
      </div>
    </div>
  );
}
