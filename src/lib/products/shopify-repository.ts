import "server-only";

import { storefront } from "@/lib/shopify/client";
import { mapProduct, type RawProduct } from "@/lib/shopify/map";
import {
  COLLECTIONS_QUERY,
  COLLECTION_PRODUCTS_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
} from "@/lib/shopify/queries";
import type { CategorySummary, Product } from "@/types/product";
import type { ProductRepository } from "./repository";

/**
 * Shopify Storefront implementation of the product repository.
 *
 * Categories map to Shopify collections, not `productType`: collections are
 * what the merchant actually curates in admin, so the site's taxonomy tracks
 * the store without a code change.
 */

const PAGE_SIZE = 250;

/** Merchandising collections that must not appear as catalogue categories. */
const NON_TAXONOMY_HANDLES = new Set(["frontpage"]);

/** Catalogue order for categories the store happens to have. */
const CATEGORY_ORDER = [
  "mixers",
  "amplifiers",
  "speakers",
  "microphones",
  "processors",
  "drivers",
  "crossovers",
  "accessories",
];

function orderIndex(handle: string): number {
  const index = CATEGORY_ORDER.indexOf(handle);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

/** Escape a user-supplied term before embedding it in a Shopify query string. */
function escapeQueryTerm(term: string): string {
  return term.replace(/["\\]/g, "\\$&");
}

async function fetchAllProducts(): Promise<Product[]> {
  const products: Product[] = [];
  let after: string | undefined;

  // The catalogue is small, but paginate anyway — it will not stay small.
  for (;;) {
    const data = await storefront<{
      products: {
        nodes: RawProduct[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(PRODUCTS_QUERY, {
      variables: { first: PAGE_SIZE, after, sortKey: "TITLE" },
      tags: ["shopify-products"],
    });

    products.push(...data.products.nodes.map(mapProduct));

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor ?? undefined;
    if (!after) break;
  }

  return products;
}

export const shopifyProductRepository: ProductRepository = {
  getAll: fetchAllProducts,

  async getByHandle(handle) {
    const data = await storefront<{ product: RawProduct | null }>(
      PRODUCT_BY_HANDLE_QUERY,
      {
        variables: { handle },
        tags: ["shopify-products", `product:${handle}`],
      },
    );
    return data.product ? mapProduct(data.product) : null;
  },

  async getByHandles(handles) {
    if (handles.length === 0) return [];

    // One query for the whole set, then reordered to the requested order —
    // a request per handle would be a waterfall on every page render.
    const query = handles
      .map((handle) => `handle:${escapeQueryTerm(handle)}`)
      .join(" OR ");

    const data = await storefront<{ products: { nodes: RawProduct[] } }>(
      PRODUCTS_QUERY,
      {
        variables: { first: Math.min(handles.length, PAGE_SIZE), query },
        tags: ["shopify-products"],
      },
    );

    const byHandle = new Map(
      data.products.nodes.map((node) => [node.handle, mapProduct(node)]),
    );
    return handles
      .map((handle) => byHandle.get(handle))
      .filter((product): product is Product => Boolean(product));
  },

  async getByCategory(categorySlug) {
    const data = await storefront<{
      collection: { products: { nodes: RawProduct[] } } | null;
    }>(COLLECTION_PRODUCTS_QUERY, {
      variables: { handle: categorySlug, first: PAGE_SIZE },
      tags: ["shopify-products", `collection:${categorySlug}`],
    });

    if (!data.collection) return [];
    return data.collection.products.nodes.map(mapProduct);
  },

  async getCategories() {
    const data = await storefront<{
      collections: {
        nodes: {
          handle: string;
          title: string;
          image?: { url: string; altText: string | null } | null;
          products: { nodes: { id: string }[] };
        }[];
      };
    }>(COLLECTIONS_QUERY, {
      variables: { first: 100 },
      tags: ["shopify-collections"],
    });

    return data.collections.nodes
      .filter(
        (node) =>
          !NON_TAXONOMY_HANDLES.has(node.handle) &&
          node.products.nodes.length > 0,
      )
      .map<CategorySummary>((node) => ({
        name: node.title,
        slug: node.handle,
        count: node.products.nodes.length,
        ...(node.image?.url
          ? {
              image: {
                src: node.image.url,
                alt: node.image.altText?.trim() || node.title,
              },
            }
          : {}),
      }))
      .sort((a, b) => {
        const delta = orderIndex(a.slug) - orderIndex(b.slug);
        return delta !== 0 ? delta : a.name.localeCompare(b.name);
      });
  },

  async search(term) {
    const trimmed = term.trim();
    if (!trimmed) return [];

    // Shopify's product query syntax searches title, vendor, tag, sku and
    // product_type. The bare term covers the default fields; the explicit
    // sku/tag clauses catch matches the default index misses.
    const escaped = escapeQueryTerm(trimmed);
    const query = `${escaped} OR sku:*${escaped}* OR tag:${escaped}`;

    const data = await storefront<{ products: { nodes: RawProduct[] } }>(
      PRODUCTS_QUERY,
      {
        variables: { first: 50, query, sortKey: "RELEVANCE" },
        revalidate: 60,
        tags: ["shopify-products"],
      },
    );

    return data.products.nodes.map(mapProduct);
  },

  async getRelated(handle, limit = 4) {
    const product = await this.getByHandle(handle);
    if (!product) return [];

    const categoryHandle = product.categoryHandle;
    const pool = categoryHandle
      ? await this.getByCategory(categoryHandle)
      : await fetchAllProducts();

    const related = pool.filter((candidate) => candidate.handle !== handle);

    // Top up from the wider catalogue when a category is too thin to fill
    // the row — an empty "Pairs with" strip looks broken.
    if (related.length < limit) {
      const all = await fetchAllProducts();
      for (const candidate of all) {
        if (related.length >= limit) break;
        if (candidate.handle === handle) continue;
        if (related.some((existing) => existing.handle === candidate.handle)) {
          continue;
        }
        related.push(candidate);
      }
    }

    return related.slice(0, limit);
  },
};
