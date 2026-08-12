import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { productRepository } from "@/lib/products";

/**
 * The sitemap is metadata, not content. If Shopify is briefly unreachable at
 * build time, emit the static routes rather than failing the whole deployment
 * — a deploy that dies over a sitemap is a worse outcome than a sitemap that
 * is briefly missing its product URLs. It is regenerated on revalidation.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: Awaited<ReturnType<typeof productRepository.getAll>> = [];
  let categories: Awaited<
    ReturnType<typeof productRepository.getCategories>
  > = [];

  try {
    [products, categories] = await Promise.all([
      productRepository.getAll(),
      productRepository.getCategories(),
    ]);
  } catch (error) {
    console.error("[pro1st] sitemap: Shopify unreachable, emitting static routes only.", error);
  }

  const staticRoutes = ["", "/products", "/origin", "/contact", "/wholesale"];

  return [
    ...staticRoutes.map((path) => ({
      url: `${site.url}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...categories.map((category) => ({
      url: `${site.url}/products?category=${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...products.map((product) => ({
      url: `${site.url}/products/${product.handle}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
