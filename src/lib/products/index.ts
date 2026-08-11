import { arsenalHandles, bestSellerHandles } from "@/data/featured";
import type { Product } from "@/types/product";
import { shopifyProductRepository } from "./shopify-repository";
import type { ProductRepository } from "./repository";

/**
 * Shopify is the catalogue. There is no second source.
 *
 * Product facts — titles, prices, media, availability, categories — are never
 * written down in this repository. If Shopify is unreachable the pages fail
 * loudly through the route error boundary, which is the correct behaviour for
 * a storefront: showing a stale hardcoded price is worse than showing nothing.
 */
export const productRepository: ProductRepository = shopifyProductRepository;

/**
 * Featured products, merchant-controlled.
 *
 * Prefers whatever the merchant has flagged with the `custom.featured`
 * metafield in Shopify. Falls back to a curated handle list only while no
 * product is flagged, so the homepage is never empty and re-merchandising
 * never needs a deploy.
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
