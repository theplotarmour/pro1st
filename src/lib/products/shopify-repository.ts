import type { ProductRepository } from "./repository";
import type { Product } from "@/types/product";

/**
 * PHASE 5 — Shopify Storefront API.
 *
 * Shopify is being configured in parallel, so this implementation is a
 * documented seam rather than a guess at the eventual schema. Fill in
 * `toProduct` and the queries once the catalogue exists; the UI needs no
 * changes at all.
 *
 * Enable with:
 *   PRODUCT_SOURCE=shopify
 *   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
 *   SHOPIFY_STOREFRONT_TOKEN=...
 */

const API_VERSION = "2025-07";

interface ShopifyConfig {
  domain: string;
  token: string;
}

function readConfig(): ShopifyConfig {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) {
    throw new Error(
      "Shopify product source selected but SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_TOKEN are not set.",
    );
  }
  return { domain, token };
}

export async function storefrontFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const { domain, token } = readConfig();
  const response = await fetch(
    `https://${domain}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 },
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify Storefront API error ${response.status}`);
  }

  const json = (await response.json()) as { data: T; errors?: unknown };
  if (json.errors) {
    throw new Error(`Shopify Storefront API returned errors`);
  }
  return json.data;
}

/**
 * Map a Storefront `Product` node onto the frontend `Product` type.
 * Left unimplemented on purpose — writing it now would mean inventing a
 * catalogue schema the client has not built yet.
 */
function toProduct(_node: unknown): Product {
  throw new Error("shopify-repository: toProduct() is not implemented yet");
}

const notImplemented = (method: string) => (): never => {
  throw new Error(
    `shopify-repository.${method}() is not implemented yet — set PRODUCT_SOURCE=mock until the Shopify catalogue is connected.`,
  );
};

export const shopifyProductRepository: ProductRepository = {
  getAll: notImplemented("getAll"),
  getByHandle: notImplemented("getByHandle"),
  getByHandles: notImplemented("getByHandles"),
  getByCategory: notImplemented("getByCategory"),
  getCategories: notImplemented("getCategories"),
  search: notImplemented("search"),
  getRelated: notImplemented("getRelated"),
};

export { toProduct };
