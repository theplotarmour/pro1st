import { products } from "@/data/products";
import { categorySlug } from "@/lib/format";
import type { CategorySummary, Product } from "@/types/product";
import type { ProductRepository } from "./repository";

/** Order categories the way the design's mega menu and filters present them. */
const CATEGORY_ORDER = [
  "Mixers",
  "Amplifiers",
  "Speakers",
  "Microphones",
  "Processors",
  "Drivers",
  "Crossovers",
  "Accessories",
] as const;

function byHandle(handle: string): Product | undefined {
  return products.find((p) => p.handle === handle);
}

function matches(product: Product, term: string): boolean {
  const haystack = [
    product.title,
    product.category,
    product.sku ?? "",
    product.specLine ?? "",
    product.description ?? "",
    ...(product.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

export const mockProductRepository: ProductRepository = {
  async getAll() {
    return products;
  },

  async getByHandle(handle) {
    return byHandle(handle) ?? null;
  },

  async getByHandles(handles) {
    return handles
      .map(byHandle)
      .filter((p): p is Product => Boolean(p));
  },

  async getByCategory(slug) {
    return products.filter((p) => categorySlug(p.category) === slug);
  },

  async getCategories() {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }

    const summaries: CategorySummary[] = [];
    for (const name of CATEGORY_ORDER) {
      const count = counts.get(name) ?? 0;
      if (count === 0) continue;
      const first = products.find((p) => p.category === name);
      summaries.push({
        name,
        slug: categorySlug(name),
        count,
        image: first?.images[0],
      });
    }
    return summaries;
  },

  async search(query) {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return products.filter((p) => matches(p, term));
  },

  async getRelated(handle, limit = 4) {
    const product = byHandle(handle);
    if (!product) return [];
    const sameCategory = products.filter(
      (p) => p.handle !== handle && p.category === product.category,
    );
    const rest = products.filter(
      (p) => p.handle !== handle && p.category !== product.category,
    );
    return [...sameCategory, ...rest].slice(0, limit);
  },
};
