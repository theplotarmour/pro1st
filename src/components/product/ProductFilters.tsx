import Link from "next/link";
import type { CategorySummary } from "@/types/product";

interface ProductFiltersProps {
  categories: CategorySummary[];
  /** Currently selected slug, or null for "All". */
  active: string | null;
  total: number;
}

/**
 * Category filter rail.
 *
 * Plain links rather than client-side state: each filter is a real,
 * shareable, indexable URL and the page needs no JavaScript to change it.
 */
export function ProductFilters({
  categories,
  active,
  total,
}: ProductFiltersProps) {
  const chip = (isActive: boolean) =>
    `p1-mono whitespace-nowrap border px-4 py-2.5 transition-[border-color,color,background-color] duration-[120ms] ease-signal ${
      isActive
        ? "border-signal bg-signal text-ink"
        : "border-hairline text-body hover:border-signal hover:text-signal"
    }`;

  return (
    <nav aria-label="Filter by category" className="mx-[calc(var(--gutter)*-1)]">
      <div className="flex gap-2 overflow-x-auto px-[var(--gutter)] pb-2">
        <Link href="/products" className={chip(active === null)}>
          All <span className="opacity-60">{total}</span>
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className={chip(active === category.slug)}
            aria-current={active === category.slug ? "page" : undefined}
          >
            {category.name} <span className="opacity-60">{category.count}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
