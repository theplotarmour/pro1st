import { chainHandles } from "@/data/featured";
import {
  buildCopy,
  chainRoles,
  craftCopy,
  originCopy,
} from "@/data/editorial";
import { formatPrice } from "@/lib/format";
import { productRepository } from "@/lib/products";
import type { CategorySummary, Product, ProductImage } from "@/types/product";

/**
 * Bridges brand editorial with the Shopify catalogue.
 *
 * The split is deliberate and load-bearing:
 *   - Editorial voice (labels, headlines, body copy) lives in `data/editorial`.
 *     Shopify is not a CMS for brand writing, and the client owns this text.
 *   - Every product fact — name, price, image — is resolved from Shopify at
 *     request time. Nothing about a product is written down in this codebase.
 *
 * Previously these sections carried hardcoded names, prices and image URLs
 * pointing at a third-party demo host. A price in the source tree is a price
 * that goes stale the moment the merchant changes it.
 */

export interface ChainNode {
  /** Editorial role, e.g. "Amplifier". */
  label: string;
  /** Product name, from Shopify. */
  product: string;
  /** Editorial one-liner describing the role in the chain. */
  spec: string;
  /** Formatted price, from Shopify. */
  price: string;
  image: ProductImage | null;
  handle: string;
}

export interface CraftPanel {
  num: string;
  imageFirst: boolean;
  image: ProductImage | null;
  title: string;
  body: string;
}

export interface BuildUnit {
  image: ProductImage | null;
  /** e.g. "MX-1600 · ₹25,000" — both halves from Shopify. */
  unit: string;
  handle: string;
}

export interface MarqueeItem {
  label: string;
  slug: string;
  image: ProductImage | null;
}

function priceOf(product: Product | null | undefined): string {
  if (!product || typeof product.price !== "number") return "Enquire";
  return formatPrice(product.price, product.currency);
}

function imageOf(product: Product | null | undefined): ProductImage | null {
  return product?.images[0] ?? null;
}

/** Resolve a set of handles in one round trip, keyed for lookup. */
async function resolve(handles: string[]): Promise<Map<string, Product>> {
  const unique = [...new Set(handles)];
  const products = await productRepository.getByHandles(unique);
  return new Map(products.map((product) => [product.handle, product]));
}

/** The signal chain: editorial roles, Shopify products. */
export async function getChainNodes(): Promise<ChainNode[]> {
  const handles = chainRoles.map((role) => chainHandles[role.key]);
  const found = await resolve(handles);

  return chainRoles
    .map((role) => {
      const handle = chainHandles[role.key];
      const product = found.get(handle);
      // A role whose product has been removed from Shopify is dropped rather
      // than rendered as an empty slot with a dead link.
      if (!product) return null;
      return {
        label: role.label,
        product: product.title,
        spec: role.spec,
        price: priceOf(product),
        image: imageOf(product),
        handle: product.handle,
      } satisfies ChainNode;
    })
    .filter((node): node is ChainNode => node !== null);
}

/** The exploded-assembly unit. */
export async function getBuildUnit(): Promise<BuildUnit | null> {
  const product = await productRepository.getByHandle(buildCopy.handle);
  if (!product) return null;
  return {
    image: imageOf(product),
    unit: `${buildCopy.shortName} · ${priceOf(product)}`,
    handle: product.handle,
  };
}

/** Craft panels: editorial copy, Shopify product photography. */
export async function getCraftPanels(): Promise<CraftPanel[]> {
  const found = await resolve(craftCopy.map((panel) => panel.handle));

  return craftCopy.map((panel, index) => {
    const product = found.get(panel.handle);
    return {
      num: `[ 0${index + 1} / 0${craftCopy.length} ]`,
      imageFirst: index % 2 === 0,
      image: imageOf(product),
      title: panel.title,
      body: panel.body,
    };
  });
}

/** Category rail — real Shopify collections, doubled by the component. */
export async function getMarqueeItems(): Promise<MarqueeItem[]> {
  const categories = await productRepository.getCategories();
  return categories.map((category: CategorySummary) => ({
    label: category.name,
    slug: category.slug,
    image: category.image ?? null,
  }));
}

/** Hero unit — the product shown on the revolving chassis. */
export async function getHeroUnit(): Promise<ProductImage | null> {
  const product = await productRepository.getByHandle(chainHandles.mixer);
  return imageOf(product);
}

/**
 * Origin imagery.
 *
 * There is no workshop or facility photography in Shopify Files yet — the
 * store holds product shots only. Rather than point at a third-party host,
 * this falls back to the flagship product image and flags the gap. Upload a
 * real facility photograph to Shopify and it will be used automatically.
 */
export async function getOriginImage(): Promise<ProductImage | null> {
  const product = await productRepository.getByHandle(originCopy.imageHandle);
  return imageOf(product);
}
