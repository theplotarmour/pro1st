import { mockProductRepository } from "./mock-repository";
import { shopifyProductRepository } from "./shopify-repository";
import type { ProductRepository } from "./repository";

/**
 * The one place the data source is chosen. Everything above this line is
 * presentation; everything below it is data.
 */
export const productRepository: ProductRepository =
  process.env.PRODUCT_SOURCE === "shopify"
    ? shopifyProductRepository
    : mockProductRepository;

export type { ProductRepository };
