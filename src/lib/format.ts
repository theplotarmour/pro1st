import type { Product, ProductCategory } from "@/types/product";

const DEFAULT_CURRENCY = "INR";

/** ₹6,750 — Indian digit grouping, no decimals (catalogue prices are whole). */
export function formatPrice(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Price as shown on a card or product page. Products without a price are an
 * enquiry, not a zero — never render "₹0".
 */
export function priceLabel(product: Product): string {
  if (typeof product.price !== "number") return "Enquire";
  return formatPrice(product.price, product.currency);
}

export function categorySlug(category: ProductCategory | string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function availabilityLabel(product: Product): string | null {
  switch (product.availability?.status) {
    case "in-stock":
      return "In stock";
    case "out-of-stock":
      return "Currently unavailable";
    case "preorder":
      return "Coming soon";
    default:
      return null;
  }
}

export function isPurchasable(product: Product): boolean {
  return (
    typeof product.price === "number" &&
    product.availability?.status === "in-stock"
  );
}

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const outCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const inOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
