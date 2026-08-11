"use client";

import { useRef } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useScrollEffect } from "@/lib/motion";
import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  /** Scroll-scrubbed 3D tilt, as on the homepage grid. */
  tilt?: boolean;
  emptyMessage?: string;
  columns?: 3 | 4;
  priorityCount?: number;
}

export function ProductGrid({
  products,
  tilt = false,
  emptyMessage = "Nothing found.",
  columns = 4,
  priorityCount = 0,
}: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Each card's tilt is a pure function of its position — fixed, not random.
  useScrollEffect(
    (vh) => {
      const grid = gridRef.current;
      if (!grid || !tilt) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const bounds = grid.getBoundingClientRect();
      if (bounds.bottom < -200 || bounds.top > vh + 200) return;

      const media = grid.querySelectorAll<HTMLElement>("[data-p1-media]");
      media.forEach((element, index) => {
        const box = element.getBoundingClientRect();
        const q = (box.top + box.height / 2 - vh / 2) / vh;
        const column = index % columns;
        element.style.transform =
          `perspective(1200px) rotateX(${(q * 7).toFixed(2)}deg)` +
          ` rotateY(${((column - (columns - 1) / 2) * 2.2 * (1 - Math.abs(q))).toFixed(2)}deg)` +
          ` translateY(${(q * -14).toFixed(1)}px)`;
      });
    },
    [tilt, columns],
  );

  if (products.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div
      ref={gridRef}
      className={`grid grid-cols-2 gap-6 ${
        columns === 4
          ? "md:grid-cols-3 xl:grid-cols-4"
          : "md:grid-cols-2 xl:grid-cols-3"
      }`}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
