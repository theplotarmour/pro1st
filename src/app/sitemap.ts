import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { productRepository } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    productRepository.getAll(),
    productRepository.getCategories(),
  ]);

  const staticRoutes = ["", "/origin", "/arsenal", "/products", "/craft", "/contact"];

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
