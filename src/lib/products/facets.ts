import type { Product } from "@/types/product";

/**
 * Facets are derived from the catalogue, never declared in code.
 *
 * This is the whole point: nothing here knows that "Power Output" or
 * "Impedance" exist. It reads whatever `custom.specifications` metafields the
 * products actually carry and builds a filter group per distinct label. Add a
 * spec in Shopify and its filter appears; add a product and it lands in every
 * facet it qualifies for; add a collection and it becomes a category. No
 * deploy, no code change.
 *
 * With an empty catalogue this yields price and availability only, which is
 * exactly what should be shown until the data exists.
 */

export interface FacetValue {
  value: string;
  count: number;
}

export interface Facet {
  /** Stable key used in the URL, e.g. "power-output". */
  key: string;
  /** Human label as the merchant typed it in Shopify. */
  label: string;
  values: FacetValue[];
}

export interface PriceBounds {
  min: number;
  max: number;
}

export function facetKey(label: string): string {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Facet labels that would only ever produce one value per product. */
const EXCLUDED_LABELS = new Set(["dimensions", "weight", "sku", "part number"]);

/**
 * Build the filter set for a list of products.
 *
 * A spec only becomes a facet when at least two products carry the label and
 * it has at least two distinct values — a filter that cannot narrow anything
 * is noise, not a control.
 */
export function buildFacets(products: Product[]): Facet[] {
  const groups = new Map<string, { label: string; values: Map<string, number> }>();

  for (const product of products) {
    for (const spec of product.specifications ?? []) {
      const label = spec.label.trim();
      if (!label || EXCLUDED_LABELS.has(label.toLowerCase())) continue;

      const key = facetKey(label);
      const group = groups.get(key) ?? { label, values: new Map() };
      const value = spec.value.trim();
      if (!value) continue;
      group.values.set(value, (group.values.get(value) ?? 0) + 1);
      groups.set(key, group);
    }
  }

  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      label: group.label,
      values: [...group.values.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort(compareFacetValues),
    }))
    .filter((facet) => facet.values.length > 1)
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Tags are a second, merchant-controlled facet axis. */
export function buildTagFacet(products: Product[]): Facet | null {
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const tag of product.tags) {
      const clean = tag.trim();
      if (!clean) continue;
      counts.set(clean, (counts.get(clean) ?? 0) + 1);
    }
  }

  const values = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  if (values.length < 2) return null;
  return { key: "tag", label: "Tags", values: values.slice(0, 20) };
}

/** Numeric-aware sort so "8Ω" and "120W" order sensibly, not lexically. */
function compareFacetValues(a: FacetValue, b: FacetValue): number {
  const na = Number.parseFloat(a.value);
  const nb = Number.parseFloat(b.value);
  const aNum = Number.isFinite(na);
  const bNum = Number.isFinite(nb);
  if (aNum && bNum && na !== nb) return na - nb;
  return a.value.localeCompare(b.value);
}

export function priceBounds(products: Product[]): PriceBounds | null {
  const prices = products
    .map((product) => product.price)
    .filter((price): price is number => typeof price === "number");
  if (prices.length === 0) return null;
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

export interface ActiveFilters {
  /** facetKey -> selected values */
  specs: Record<string, string[]>;
  tags: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
}

/** Parse filters out of the URL. Unknown keys are ignored, never guessed. */
export function parseFilters(
  params: Record<string, string | string[] | undefined>,
  facets: Facet[],
): ActiveFilters {
  const known = new Set(facets.map((facet) => facet.key));
  const specs: Record<string, string[]> = {};

  for (const [key, raw] of Object.entries(params)) {
    if (!known.has(key) || key === "tag" || raw === undefined) continue;
    const values = (Array.isArray(raw) ? raw : [raw]).flatMap((v) => v.split(","));
    const clean = values.map((v) => v.trim()).filter(Boolean);
    if (clean.length > 0) specs[key] = clean;
  }

  const tagRaw = params.tag;
  const tags = tagRaw
    ? (Array.isArray(tagRaw) ? tagRaw : [tagRaw]).flatMap((v) => v.split(",")).filter(Boolean)
    : [];

  const num = (v: string | string[] | undefined) => {
    const value = Number.parseFloat(Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));
    return Number.isFinite(value) ? value : undefined;
  };

  return {
    specs,
    tags,
    minPrice: num(params.min),
    maxPrice: num(params.max),
    inStockOnly: params.stock === "in",
  };
}

export function applyFilters(
  products: Product[],
  filters: ActiveFilters,
): Product[] {
  return products.filter((product) => {
    if (filters.inStockOnly && product.availability.status !== "in-stock") {
      return false;
    }

    if (typeof product.price === "number") {
      if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
    } else if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      // Price-on-enquiry products cannot satisfy a price range.
      return false;
    }

    if (filters.tags.length > 0) {
      const owned = new Set(product.tags.map((tag) => tag.toLowerCase()));
      if (!filters.tags.every((tag) => owned.has(tag.toLowerCase()))) return false;
    }

    // Specs are AND across labels, OR within a label — the behaviour shoppers
    // expect from a faceted sidebar.
    for (const [key, wanted] of Object.entries(filters.specs)) {
      const owned = (product.specifications ?? [])
        .filter((spec) => facetKey(spec.label) === key)
        .map((spec) => spec.value.trim());
      if (!wanted.some((value) => owned.includes(value))) return false;
    }

    return true;
  });
}

export function hasActiveFilters(filters: ActiveFilters): boolean {
  return (
    Object.keys(filters.specs).length > 0 ||
    filters.tags.length > 0 ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.inStockOnly
  );
}
