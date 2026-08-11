import "server-only";

import { storefront } from "@/lib/shopify/client";
import { mapProduct, type RawProduct } from "@/lib/shopify/map";
import {
  COLLECTIONS_QUERY,
  COLLECTION_PRODUCTS_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_MEDIA_QUERY,
} from "@/lib/shopify/queries";
import type { CategorySummary, Product } from "@/types/product";
import type { GalleryShot, ProductRepository } from "./repository";

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
    // Deliberately one source call. The previous version fetched the product,
    // then its collection, then the whole catalogue — up to three round trips
    // per product page, which is what made a 25-page build hammer Shopify.
    // `getAll` is served from the client's in-process cache, so this is free.
    const all = await fetchAllProducts();
    const product = all.find((candidate) => candidate.handle === handle);
    if (!product) return [];

    const others = all.filter((candidate) => candidate.handle !== handle);
    const sameCategory = others.filter(
      (candidate) => candidate.categoryHandle === product.categoryHandle,
    );
    const rest = others.filter(
      (candidate) => candidate.categoryHandle !== product.categoryHandle,
    );

    // Fill from the same category first, then top up from the wider
    // catalogue — an empty "Pairs with" strip reads as broken.
    return [...sameCategory, ...rest].slice(0, limit);
  },

  async getGalleryMedia(limit = 24) {
    const data = await storefront<{
      products: {
        nodes: {
          handle: string;
          title: string;
          images: {
            nodes: {
              url: string;
              altText: string | null;
              width: number | null;
              height: number | null;
            }[];
          };
        }[];
      };
    }>(PRODUCT_MEDIA_QUERY, {
      variables: { first: 100, imagesPerProduct: 6 },
      tags: ["shopify-products"],
    });

    // Interleave by image index rather than concatenating per product, so the
    // wall never shows six shots of the same microphone in a row.
    const byRound: GalleryShot[][] = [];
    for (const product of data.products.nodes) {
      product.images.nodes.forEach((image, round) => {
        // Skip the featured shot — it already carries the product card.
        if (round === 0) return;
        const shot: GalleryShot = {
          src: image.url,
          alt: image.altText?.trim() || product.title,
          handle: product.handle,
          title: product.title,
        };
        if (image.width) shot.width = image.width;
        if (image.height) shot.height = image.height;
        (byRound[round] ??= []).push(shot);
      });
    }

    return byRound.flat().slice(0, limit);
  },
};
