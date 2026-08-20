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
import { searchProducts } from "./search";

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

    // Resolved from the full catalogue rather than a `handle:` search filter.
    // `handle:` is NOT a supported field on the Storefront products query —
    // Shopify silently ignores unknown filter fields and returns everything,
    // so the previous implementation handed back the first N products in the
    // store instead of the ones asked for. That emptied the signal chain and
    // quietly replaced the curated featured line-up with whatever sorted
    // first. `getAll` is served from the client cache, so this costs nothing.
    const all = await fetchAllProducts();
    const byHandle = new Map(all.map((product) => [product.handle, product]));

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
    /*
      Ranked locally against the cached catalogue rather than by a Shopify
      query. `searchProducts` carries the reasoning; the short version is
      that Shopify's default product search reads the body copy, so
      "amplifier" matched every microphone whose description mentions
      plugging into one, and an `OR` across clauses gave it no way to rank a
      title hit above a tag hit. Both faults were visible on the first real
      search.

      `fetchAllProducts` is served from the in-process cache, so this costs
      no round trip — which is also what lets the header search return
      results at typing speed without a request per keystroke.
    */
    return searchProducts(await fetchAllProducts(), term);
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
