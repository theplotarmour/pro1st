/**
 * Frontend product abstraction.
 *
 * This is the shape the UI consumes. It is deliberately NOT the Shopify
 * schema — the Shopify repository maps Storefront API responses onto this
 * type, so no component ever has to change when the data source flips.
 */

export type ProductCategory =
  | "Mixers"
  | "Amplifiers"
  | "Speakers"
  | "Microphones"
  | "Processors"
  | "Drivers"
  | "Crossovers"
  | "Accessories";

export type AvailabilityStatus = "in-stock" | "out-of-stock" | "preorder";

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductAvailability {
  status: AvailabilityStatus;
  quantity?: number;
}

export interface ProductDocument {
  label: string;
  url: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  category: ProductCategory;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  sku?: string;

  images: ProductImage[];

  /**
   * Only populated where the client has supplied verified figures.
   * Never fabricate entries — `ProductSpecs` renders an empty state instead.
   */
  specifications?: ProductSpecification[];

  features?: string[];

  availability?: ProductAvailability;

  documents?: ProductDocument[];

  tags?: string[];

  /** Short mono metadata line shown on cards, e.g. "6-channel · 99 DSP". */
  specLine?: string;
}

/** A category as surfaced in navigation and gallery filters. */
export interface CategorySummary {
  name: ProductCategory;
  slug: string;
  count: number;
  image?: ProductImage;
}

export interface CartLine {
  productId: string;
  handle: string;
  title: string;
  category: ProductCategory;
  price: number;
  currency: string;
  image?: ProductImage;
  quantity: number;
}
