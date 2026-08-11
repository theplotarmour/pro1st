import type { CategorySummary, Product } from "@/types/product";

/**
 * The single seam between the UI and its data source.
 *
 * Components and pages call this interface only. Swapping mock data for the
 * Shopify Storefront API means providing another implementation — not
 * touching a single component.
 */
export interface ProductRepository {
  getAll(): Promise<Product[]>;
  getByHandle(handle: string): Promise<Product | null>;
  getByHandles(handles: readonly string[]): Promise<Product[]>;
  getByCategory(categorySlug: string): Promise<Product[]>;
  getCategories(): Promise<CategorySummary[]>;
  search(query: string): Promise<Product[]>;
  getRelated(handle: string, limit?: number): Promise<Product[]>;
  /** Flattened product photography for editorial galleries. */
  getGalleryMedia(limit?: number): Promise<GalleryShot[]>;
}

/** One photograph, with the product it belongs to. */
export interface GalleryShot {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  handle: string;
  title: string;
}
