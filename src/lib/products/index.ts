import { arsenalHandles, bestSellerHandles } from "@/data/featured";
import { isShopifyConfigured } from "@/lib/shopify/client";
import type { Product } from "@/types/product";
import { mockProductRepository } from "./mock-repository";
import { shopifyProductRepository } from "./shopify-repository";
import type { ProductRepository } from "./repository";

/**
 * The one place the data source is chosen. Everything above this line is
 * presentation; everything below it is data.
 *
 * Shopify is used whenever it is configured. `PRODUCT_SOURCE=mock` forces the
 * local catalogue, which is what makes the UI runnable with no credentials.
 */
function selectRepository(): ProductRepository {
  const forced = process.env.PRODUCT_SOURCE;
  if (forced === "mock") return mockProductRepository;
  if (forced === "shopify") return shopifyProductRepository;
  return isShopifyConfigured()
    ? shopifyProductRepository
    : mockProductRepository;
}

export const productRepository: ProductRepository = selectRepository();

export const usingShopify = () => process.env.PRODUCT_SOURCE !== "mock" && isShopifyConfigured();

/**
 * Featured products, merchant-controlled.
 *
 * Prefers whatever the merchant has flagged with the `custom.featured`
 * metafield in Shopify. Falls back to the curated handle list only while no
 * product is flagged, so the homepage is never empty and never requires a
 * deploy to re-merchandise.
 */
export async function getFeaturedProducts(
  fallbackHandles: readonly string[] = bestSellerHandles,
  limit = 8,
): Promise<Product[]> {
  const all = await productRepository.getAll();
  const flagged = all.filter((product) => product.featured);
  if (flagged.length > 0) return flagged.slice(0, limit);

  const curated = await productRepository.getByHandles(fallbackHandles);
  if (curated.length > 0) return curated.slice(0, limit);

  return all.slice(0, limit);
}

export async function getArsenalProducts(limit = 6): Promise<Product[]> {
  return getFeaturedProducts(arsenalHandles, limit);
}

export type { ProductRepository };
