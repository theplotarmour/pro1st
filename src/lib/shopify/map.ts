import type {
  Cart,
  CartLine,
  Product,
  ProductDocument,
  ProductImage,
  ProductSpecification,
  ProductVariant,
} from "@/types/product";

/**
 * Shopify Storefront → frontend model.
 *
 * The whole point of this file: if Shopify changes shape, only this file
 * changes. Components never see a Storefront response.
 */

/* ---------- raw Storefront shapes (only what we query) ---------- */

interface RawMoney {
  amount: string;
  currencyCode: string;
}
interface RawImage {
  url: string;
  altText: string | null;
  width?: number | null;
  height?: number | null;
}
interface RawMetafield {
  namespace: string;
  key: string;
  value: string;
  type?: string;
}
interface RawVariant {
  id: string;
  title?: string;
  sku?: string | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  currentlyNotInStock?: boolean;
  selectedOptions?: { name: string; value: string }[];
  price: RawMoney;
  compareAtPrice?: RawMoney | null;
  image?: RawImage | null;
}
export interface RawProduct {
  id: string;
  handle: string;
  title: string;
  description?: string;
  descriptionHtml?: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  availableForSale: boolean;
  totalInventory?: number | null;
  seo?: { title: string | null; description: string | null };
  featuredImage?: RawImage | null;
  images?: { nodes: RawImage[] };
  options?: { name: string; optionValues: { name: string }[] }[];
  priceRange?: { minVariantPrice: RawMoney };
  compareAtPriceRange?: { minVariantPrice: RawMoney };
  collections?: { nodes: { handle: string; title: string }[] };
  variants?: { nodes: RawVariant[] };
  metafields?: (RawMetafield | null)[];
}

const DEFAULT_CURRENCY = "INR";

/* ---------- helpers ---------- */

function money(value?: RawMoney | null): number | undefined {
  if (!value) return undefined;
  const amount = Number.parseFloat(value.amount);
  return Number.isFinite(amount) ? amount : undefined;
}

function image(raw: RawImage | null | undefined, fallbackAlt: string) {
  if (!raw?.url) return undefined;
  const result: ProductImage = {
    src: raw.url,
    alt: raw.altText?.trim() || fallbackAlt,
  };
  if (raw.width) result.width = raw.width;
  if (raw.height) result.height = raw.height;
  return result;
}

function metafield(
  metafields: (RawMetafield | null)[] | undefined,
  key: string,
): string | undefined {
  const found = metafields?.find((m) => m && m.key === key);
  return found?.value ?? undefined;
}

/**
 * Metafield values arrive as JSON strings. Anything malformed is dropped
 * rather than rendered — a broken spec table is worse than none.
 */
function parseJson<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function parseSpecifications(
  value: string | undefined,
): ProductSpecification[] | undefined {
  const parsed = parseJson<unknown>(value);
  if (!Array.isArray(parsed)) return undefined;

  const rows = parsed.flatMap((entry): ProductSpecification[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const row = entry as Record<string, unknown>;
    const label = row.label ?? row.name ?? row.key;
    const val = row.value ?? row.val;
    if (typeof label !== "string" || typeof val !== "string") return [];
    if (!label.trim() || !val.trim()) return [];
    return [{ label: label.trim(), value: val.trim() }];
  });

  return rows.length > 0 ? rows : undefined;
}

function parseStringList(value: string | undefined): string[] | undefined {
  const parsed = parseJson<unknown>(value);
  if (!Array.isArray(parsed)) return undefined;
  const items = parsed.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
  return items.length > 0 ? items : undefined;
}

function parseDocuments(
  value: string | undefined,
): ProductDocument[] | undefined {
  const parsed = parseJson<unknown>(value);
  if (!Array.isArray(parsed)) return undefined;
  const docs = parsed.flatMap((entry): ProductDocument[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const row = entry as Record<string, unknown>;
    if (typeof row.label !== "string" || typeof row.url !== "string") return [];
    return [{ label: row.label, url: row.url }];
  });
  return docs.length > 0 ? docs : undefined;
}

/** Collections named "Home page"/frontpage are merchandising, not taxonomy. */
const NON_TAXONOMY_HANDLES = new Set(["frontpage"]);

function pickCategory(product: RawProduct) {
  const taxonomy = (product.collections?.nodes ?? []).filter(
    (c) => !NON_TAXONOMY_HANDLES.has(c.handle),
  );
  const primary = taxonomy[0];
  return {
    category: primary?.title ?? product.productType?.trim() ?? "",
    categoryHandle: primary?.handle,
    collections: taxonomy,
  };
}

function mapVariant(raw: RawVariant, currency: string): ProductVariant {
  const variant: ProductVariant = {
    id: raw.id,
    title: raw.title ?? "Default Title",
    currency: raw.price?.currencyCode ?? currency,
    availableForSale: raw.availableForSale,
    selectedOptions: raw.selectedOptions ?? [],
  };
  if (raw.sku) variant.sku = raw.sku;
  const price = money(raw.price);
  if (price !== undefined) variant.price = price;
  const compare = money(raw.compareAtPrice);
  // Shopify returns a compare-at even when it equals the price; only a
  // genuinely higher value is a markdown worth showing.
  if (compare !== undefined && price !== undefined && compare > price) {
    variant.compareAtPrice = compare;
  }
  if (typeof raw.quantityAvailable === "number") {
    variant.quantityAvailable = raw.quantityAvailable;
  }
  const variantImage = image(raw.image, raw.title ?? "");
  if (variantImage) variant.image = variantImage;
  return variant;
}

/* ---------- product ---------- */

export function mapProduct(raw: RawProduct): Product {
  const currency =
    raw.priceRange?.minVariantPrice.currencyCode ?? DEFAULT_CURRENCY;
  const { category, categoryHandle, collections } = pickCategory(raw);

  const variants = (raw.variants?.nodes ?? []).map((v) =>
    mapVariant(v, currency),
  );

  const images: ProductImage[] = [];
  const featured = image(raw.featuredImage, raw.title);
  if (featured) images.push(featured);
  for (const node of raw.images?.nodes ?? []) {
    const mapped = image(node, raw.title);
    if (mapped && !images.some((existing) => existing.src === mapped.src)) {
      images.push(mapped);
    }
  }

  const price = money(raw.priceRange?.minVariantPrice);
  const compareAt = money(raw.compareAtPriceRange?.minVariantPrice);

  const totalQuantity = variants.reduce(
    (sum, v) => sum + (v.quantityAvailable ?? 0),
    0,
  );

  const product: Product = {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    category,
    collections,
    currency,
    images,
    options: (raw.options ?? []).map((option) => ({
      name: option.name,
      values: option.optionValues.map((v) => v.name),
    })),
    variants,
    tags: raw.tags ?? [],
    availability: {
      status: raw.availableForSale ? "in-stock" : "out-of-stock",
      ...(totalQuantity > 0 ? { quantity: totalQuantity } : {}),
    },
  };

  if (categoryHandle) product.categoryHandle = categoryHandle;
  if (raw.description) product.description = raw.description;
  if (raw.descriptionHtml) product.descriptionHtml = raw.descriptionHtml;
  if (raw.vendor) product.vendor = raw.vendor;
  if (price !== undefined) product.price = price;
  if (compareAt !== undefined && price !== undefined && compareAt > price) {
    product.compareAtPrice = compareAt;
  }

  const sku = variants.find((v) => v.sku)?.sku;
  if (sku) product.sku = sku;

  // Specs, features, applications and documents come from metafields only.
  // Absent metafield → absent field → the UI shows its empty state.
  const specifications = parseSpecifications(
    metafield(raw.metafields, "specifications"),
  );
  if (specifications) product.specifications = specifications;

  const features = parseStringList(metafield(raw.metafields, "features"));
  if (features) product.features = features;

  const applications = parseStringList(
    metafield(raw.metafields, "applications"),
  );
  if (applications) product.applications = applications;

  const documents = parseDocuments(metafield(raw.metafields, "documents"));
  if (documents) product.documents = documents;

  const specLine = metafield(raw.metafields, "spec_line");
  if (specLine?.trim()) product.specLine = specLine.trim();

  if (metafield(raw.metafields, "featured") === "true") {
    product.featured = true;
  }

  if (raw.seo?.title || raw.seo?.description) {
    product.seo = {
      ...(raw.seo.title ? { title: raw.seo.title } : {}),
      ...(raw.seo.description ? { description: raw.seo.description } : {}),
    };
  }

  return product;
}

/* ---------- cart ---------- */

interface RawCartLine {
  id: string;
  quantity: number;
  cost?: { totalAmount: RawMoney };
  merchandise: RawVariant & {
    product: {
      id: string;
      handle: string;
      title: string;
      productType?: string;
      collections?: { nodes: { title: string; handle: string }[] };
    };
  };
}

export interface RawCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: RawMoney; totalAmount: RawMoney };
  lines: { nodes: RawCartLine[] };
}

export function mapCart(raw: RawCart): Cart {
  const currency = raw.cost.subtotalAmount.currencyCode;

  const lines: CartLine[] = raw.lines.nodes.map((node) => {
    const variant = node.merchandise;
    const product = variant.product;
    const line: CartLine = {
      id: node.id,
      variantId: variant.id,
      productId: product.id,
      handle: product.handle,
      title: product.title,
      category:
        product.collections?.nodes.find((c) => c.handle !== "frontpage")
          ?.title ??
        product.productType ??
        "",
      price: money(variant.price) ?? 0,
      currency: variant.price?.currencyCode ?? currency,
      quantity: node.quantity,
      availableForSale: variant.availableForSale,
    };
    // "Default Title" is Shopify's placeholder for a single-variant product.
    if (variant.title && variant.title !== "Default Title") {
      line.variantTitle = variant.title;
    }
    const lineImage = image(variant.image, product.title);
    if (lineImage) line.image = lineImage;
    if (typeof variant.quantityAvailable === "number") {
      line.quantityAvailable = variant.quantityAvailable;
    }
    return line;
  });

  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    subtotal: money(raw.cost.subtotalAmount) ?? 0,
    total: money(raw.cost.totalAmount) ?? 0,
    currency,
    lines,
  };
}
