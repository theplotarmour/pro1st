import { products } from "@/data/products";
import { categorySlug } from "@/lib/format";
import type { CategorySummary, Product } from "@/types/product";
import type { ProductRepository } from "./repository";

/**
 * Local fallback repository. Mirrors the Shopify implementation's behaviour
 * closely enough that switching sources is not observable in the UI.
 */

const CATEGORY_ORDER = [
  "Mixers",
  "Amplifiers",
  "Speakers",
  "Microphones",
  "Processors",
  "Accessories",
];

function byHandle(handle: string): Product | undefined {
  return products.find((p) => p.handle === handle);
}

function matches(product: Product, term: string): boolean {
  return [
    product.title,
    product.category,
    product.sku ?? "",
    product.specLine ?? "",
    product.description ?? "",
    ...product.tags,
  ]
    .join(" ")
    .toLowerCase()
    .includes(term);
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
    return products.filter(
      (p) => (p.categoryHandle ?? categorySlug(p.category)) === slug,
    );
  },

  async getCategories() {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map<CategorySummary>(([name, count]) => {
        const first = products.find((p) => p.category === name);
        return {
          name,
          slug: categorySlug(name),
          count,
          ...(first?.images[0] ? { image: first.images[0] } : {}),
        };
      })
      .sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.name);
        const bi = CATEGORY_ORDER.indexOf(b.name);
        const ao = ai === -1 ? CATEGORY_ORDER.length : ai;
        const bo = bi === -1 ? CATEGORY_ORDER.length : bi;
        return ao !== bo ? ao - bo : a.name.localeCompare(b.name);
      });
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
