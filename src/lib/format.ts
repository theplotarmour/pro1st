import type { Product, ProductVariant } from "@/types/product";

const DEFAULT_CURRENCY = "INR";

/** ₹6,750 — Indian digit grouping, no decimals unless the price has them. */
export function formatPrice(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/**
 * Price as shown on a card or product page. A product with no price is an
 * enquiry, not a zero — never render "₹0".
 */
export function priceLabel(product: Product): string {
  if (typeof product.price !== "number") return "Enquire";
  return formatPrice(product.price, product.currency);
}

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function availabilityLabel(product: Product): string | null {
  switch (product.availability.status) {
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

/** The variant a buyer gets by default: first sellable, else first. */
export function defaultVariant(product: Product): ProductVariant | undefined {
  return (
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0]
  );
}

export function isPurchasable(product: Product): boolean {
  return product.variants.some(
    (variant) => variant.availableForSale && typeof variant.price === "number",
  );
}

/** True when the product has real, buyer-relevant options (not "Default Title"). */
export function hasRealOptions(product: Product): boolean {
  return (
    product.options.length > 0 &&
    product.options.some(
      (option) => option.name !== "Title" && option.values.length > 1,
    )
  );
}

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const outCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const inOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
