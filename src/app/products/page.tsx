import type { Metadata } from "next";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { productRepository } from "@/lib/products";

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

/**
 * Category is a query parameter rather than a path segment so that
 * /products/[handle] stays free for product detail — the IA from the brief
 * with no route collision.
 */
export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const categories = await productRepository.getCategories();
  const match = categories.find((c) => c.slug === category);

  const title = match ? `${match.name}` : "Product Gallery";
  const description = match
    ? `PRO1st ${match.name.toLowerCase()} — professional audio equipment built for live events, installations and rental stock.`
    : "The full PRO1st catalogue: mixers, amplifiers, speakers, microphones, processors, drivers, crossovers and accessories.";

  return {
    title,
    description,
    alternates: {
      canonical: match ? `/products?category=${match.slug}` : "/products",
    },
    openGraph: { title: `${title} · PRO1ST`, description },
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { category } = await searchParams;

  const [categories, all] = await Promise.all([
    productRepository.getCategories(),
    productRepository.getAll(),
  ]);

  const active = categories.some((c) => c.slug === category)
    ? (category as string)
    : null;

  const products = active
    ? await productRepository.getByCategory(active)
    : all;

  const activeName = categories.find((c) => c.slug === active)?.name;

  return (
    <>
      <PageHeader
        eyebrow="[ Product Gallery ]"
        title={activeName ?? "The full line."}
        lead={
          activeName
            ? undefined
            : "Every published SKU, filterable by category. Specifications are shown where the figures are confirmed."
        }
      />

      <Container as="section" className="pb-24 lg:pb-32">
        <ProductFilters
          categories={categories}
          active={active}
          total={all.length}
        />

        <p className="p1-mono mb-10 mt-8 text-[rgba(230,230,230,0.45)]">
          {products.length} {products.length === 1 ? "product" : "products"}
          {activeName ? ` in ${activeName}` : ""}
        </p>

        <ProductGrid
          products={products}
          priorityCount={4}
          emptyMessage="Nothing found in this category."
        />
      </Container>

      <ContactCTA />
    </>
  );
}
