"use client";

import Link from "next/link";
import { Media } from "@/components/ui/Media";
import type { CategorySummary } from "@/types/product";

interface MegaMenuProps {
  categories: CategorySummary[];
  onClose: () => void;
}

/**
 * Desktop-only category panel. Counts come from the catalogue, so they stay
 * truthful once Shopify replaces the mock data.
 */
export function MegaMenu({ categories, onClose }: MegaMenuProps) {
  return (
    <div
      onMouseLeave={onClose}
      className="fixed inset-x-0 top-0 z-[119] hidden gutter-x border-b border-hairline bg-[rgba(13,13,15,0.97)] pt-24 pb-10 backdrop-blur-lg lg:block"
    >
      <div className="p1-shell grid grid-cols-3 gap-6 xl:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            onClick={onClose}
            className="flex flex-col gap-3 border border-transparent p-3.5 transition-[background-color,border-color] duration-200 ease-signal hover:border-hairline hover:bg-panel"
          >
            <div className="relative aspect-[4/3] overflow-hidden border border-hairline bg-panel">
              {category.image ? (
                <Media
                  src={category.image.src}
                  alt=""
                  sizes="(max-width: 1280px) 33vw, 16vw"
                />
              ) : null}
            </div>
            <div className="font-display text-[15px] font-medium text-strong">
              {category.name}
            </div>
            <div className="p1-mono text-soft">
              {String(category.count).padStart(2, "0")}{" "}
              {category.count === 1 ? "SKU" : "SKUs"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
