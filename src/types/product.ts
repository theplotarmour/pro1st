/**
 * Frontend product abstraction.
 *
 * The shape the UI consumes. Deliberately NOT the Shopify schema — the
 * Shopify repository maps Storefront API responses onto this type, so no
 * component changes when the data source does.
 *
 * Category is a plain string because categories are Shopify collections,
 * which the merchant can add or rename at any time. Hardcoding a union here
 * would mean a code deploy every time the catalogue is reorganised.
 */

export type AvailabilityStatus = "in-stock" | "out-of-stock" | "preorder";

export interface ProductImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
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

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  /** Shopify variant GID — this is what the Cart API calls merchandiseId. */
  id: string;
  title: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  currency: string;
  availableForSale: boolean;
  quantityAvailable?: number;
  selectedOptions: SelectedOption[];
  image?: ProductImage;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductCollectionRef {
  handle: string;
  title: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  /** Primary collection title, e.g. "Microphones". Empty when uncategorised. */
  category: string;
  categoryHandle?: string;
  /** Every collection the product belongs to. */
  collections: ProductCollectionRef[];

  description?: string;
  descriptionHtml?: string;
  sku?: string;
  vendor?: string;

  /** Lowest variant price. Absent means enquiry-only, never zero. */
  price?: number;
  compareAtPrice?: number;
  currency: string;

  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];

  /** Populated from Shopify metafields only. Never fabricated. */
  specifications?: ProductSpecification[];
  features?: string[];
  applications?: string[];
  documents?: ProductDocument[];

  availability: ProductAvailability;
  tags: string[];
  featured?: boolean;

  seo?: { title?: string; description?: string };

  /** Short mono metadata line on cards. Derived, never invented. */
  specLine?: string;
}

/** A category as surfaced in navigation and gallery filters. */
export interface CategorySummary {
  name: string;
  slug: string;
  count: number;
  image?: ProductImage;
}

/** One line in the cart. `id` is the Shopify cart line ID. */
export interface CartLine {
  id: string;
  variantId: string;
  productId: string;
  handle: string;
  title: string;
  variantTitle?: string;
  category: string;
  price: number;
  currency: string;
  image?: ProductImage;
  quantity: number;
  availableForSale: boolean;
  quantityAvailable?: number;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: number;
  total: number;
  currency: string;
  lines: CartLine[];
}
