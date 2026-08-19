import Link from "next/link";
import type { CategorySummary } from "@/types/product";
import type { ActiveFilters, Facet, PriceBounds } from "@/lib/products/facets";
import { formatPrice } from "@/lib/format";

interface FilterSidebarProps {
  categories: CategorySummary[];
  activeCategory: string | null;
  facets: Facet[];
  tagFacet: Facet | null;
  bounds: PriceBounds | null;
  filters: ActiveFilters;
  /** Current query, so links can toggle one value and keep the rest. */
  params: Record<string, string | string[] | undefined>;
  resultCount: number;
}

/**
 * Faceted sidebar.
 *
 * Every control is a link, so each filter combination is a real, shareable,
 * indexable URL and the page needs no JavaScript to filter. Facet groups are
 * derived from the catalogue at request time — this component does not know
 * what a "Power Output" is, it renders whatever labels the products carry.
 *
 * Until specification metafields exist in Shopify, this correctly shows
 * category, availability and price only, then grows on its own.
 */
export function FilterSidebar({
  categories,
  activeCategory,
  facets,
  tagFacet,
  bounds,
  filters,
  params,
  resultCount,
}: FilterSidebarProps) {
  /** Build a href with one parameter toggled, everything else preserved. */
  const toggle = (key: string, value: string): string => {
    const next = new URLSearchParams();
    for (const [k, raw] of Object.entries(params)) {
      if (raw === undefined) continue;
      const flat = (Array.isArray(raw) ? raw : [raw]).join(",");
      if (flat) next.set(k, flat);
    }
    const current = (next.get(key) ?? "").split(",").filter(Boolean);
    const has = current.includes(value);
    const updated = has
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (updated.length > 0) next.set(key, updated.join(","));
    else next.delete(key);
    const qs = next.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  const allFacets = tagFacet ? [...facets, tagFacet] : facets;

  const check = (active: boolean) =>
    `grid h-3.5 w-3.5 flex-none place-items-center border transition-colors duration-[160ms] ease-signal ${
      active ? "border-signal bg-signal" : "border-hairline"
    }`;

  /*
    Built once, rendered into whichever branch the viewport calls for.

    On a phone this column stacks above the grid, and expanded it is seven
    facet groups deep — the reader scrolled through the entire filter set
    before reaching a single product. Collapsed behind a disclosure it costs
    one row, and the count stays on the summary so it still reports what the
    filters are doing while shut.
  */
  const body = (
    <>
      {/* Category — always present, sourced from Shopify collections. */}
      <FilterGroup label="Category">
        <FilterLink href="/products" active={activeCategory === null}>
          <span className={check(activeCategory === null)} />
          All products
        </FilterLink>
        {categories.map((category) => (
          <FilterLink
            key={category.slug}
            href={`/products?category=${category.slug}`}
            active={activeCategory === category.slug}
          >
            <span className={check(activeCategory === category.slug)} />
            <span className="flex-1">{category.name}</span>
            <span className="p1-mono text-faint">{category.count}</span>
          </FilterLink>
        ))}
      </FilterGroup>

      <FilterGroup label="Availability">
        <FilterLink href={toggle("stock", "in")} active={filters.inStockOnly}>
          <span className={check(filters.inStockOnly)} />
          In stock only
        </FilterLink>
      </FilterGroup>

      {bounds ? (
        <FilterGroup label="Price">
          <div className="p1-mono mb-3 text-faint">
            {formatPrice(bounds.min)} — {formatPrice(bounds.max)}
          </div>
          <form action="/products" method="get" className="flex items-center gap-2">
            {activeCategory ? (
              <input type="hidden" name="category" value={activeCategory} />
            ) : null}
            <input
              type="number"
              name="min"
              inputMode="numeric"
              defaultValue={filters.minPrice}
              placeholder={String(bounds.min)}
              aria-label="Minimum price"
              className="p1-field px-3 py-2 text-[13px]"
            />
            <span className="text-faint">–</span>
            <input
              type="number"
              name="max"
              inputMode="numeric"
              defaultValue={filters.maxPrice}
              placeholder={String(bounds.max)}
              aria-label="Maximum price"
              className="p1-field px-3 py-2 text-[13px]"
            />
            <button
              type="submit"
              className="p1-mono flex-none border border-hairline px-3 py-2 transition-colors duration-[160ms] ease-signal hover:border-signal hover:text-signal"
            >
              Go
            </button>
          </form>
        </FilterGroup>
      ) : null}

      {/* Everything below is generated from the catalogue. */}
      {allFacets.map((facet) => (
        <FilterGroup key={facet.key} label={facet.label}>
          {facet.values.map((entry) => {
            const selected =
              facet.key === "tag"
                ? filters.tags.includes(entry.value)
                : (filters.specs[facet.key] ?? []).includes(entry.value);
            return (
              <FilterLink
                key={entry.value}
                href={toggle(facet.key, entry.value)}
                active={selected}
              >
                <span className={check(selected)} />
                <span className="flex-1">{entry.value}</span>
                <span className="p1-mono text-faint">{entry.count}</span>
              </FilterLink>
            );
          })}
        </FilterGroup>
      ))}

      {allFacets.length === 0 ? (
        <p className="p1-mono mt-6 normal-case leading-relaxed tracking-[0.04em] text-faint">
          Technical filters appear here automatically once products carry
          specification metafields in Shopify — one filter group per spec label,
          built from the catalogue.
        </p>
      ) : null}
    </>
  );

  const heading = (
    <>
      <span className="p1-mono text-muted">Filter</span>
      <span className="p1-mono text-faint">{resultCount} shown</span>
    </>
  );

  return (
    <aside aria-label="Filters" className="lg:sticky lg:top-[104px]">
      <details className="group border-b border-hairline lg:hidden">
        <summary className="p1-tap-row flex cursor-pointer list-none items-center justify-between gap-3 py-4 marker:hidden">
          {heading}
          <span
            aria-hidden="true"
            className="text-signal transition-transform duration-[240ms] ease-signal group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <div className="pb-2">{body}</div>
      </details>

      <div className="hidden lg:block">
        <div className="flex items-baseline justify-between gap-3 border-b border-hairline pb-4">
          {heading}
        </div>
        {body}
      </div>
    </aside>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details open className="group border-b border-hairline py-4">
      <summary className="p1-tap-row p1-mono flex cursor-pointer list-none items-center justify-between text-muted marker:hidden">
        {label}
        <span
          aria-hidden="true"
          className="text-faint transition-transform duration-[240ms] ease-signal group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="mt-2 flex flex-col gap-2.5 max-lg:gap-0">{children}</div>
    </details>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={`p1-tap-row flex items-center gap-3 text-[13px] leading-snug transition-colors duration-[160ms] ease-signal ${
        active ? "text-strong" : "text-body hover:text-strong"
      }`}
    >
      {children}
    </Link>
  );
}
