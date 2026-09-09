import type { Metadata } from "next";
import Link from "next/link";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { GalleryBand } from "@/components/sections/GalleryBand";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  applyFilters,
  buildFacets,
  buildTagFacet,
  hasActiveFilters,
  parseFilters,
  priceBounds,
} from "@/lib/products/facets";
import { productRepository } from "@/lib/products";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

/**
 * Product gallery.
 *
 * Category is a query parameter rather than a path segment so that
 * /products/[handle] stays free for product detail.
 *
 * The whole page is catalogue-driven: categories come from Shopify
 * collections, facet groups are derived from whatever specification
 * metafields the products carry, and price bounds from the prices present.
 * Adding a product, a collection or a spec in Shopify changes this page with
 * no deploy.
 */
export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const slug = Array.isArray(category) ? category[0] : category;
  const categories = await productRepository.getCategories();
  const match = categories.find((c) => c.slug === slug);

  const title = match ? match.name : "Product Gallery";
  const description = match
    ? `PRO1ST ${match.name.toLowerCase()} — professional audio equipment built for live events, installations and rental stock.`
    : "The full PRO1ST catalogue: mixers, amplifiers, speakers, microphones, processors, drivers, crossovers and accessories.";

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
  const params = await searchParams;
  const rawCategory = Array.isArray(params.category)
    ? params.category[0]
    : params.category;

  const [categories, all] = await Promise.all([
    productRepository.getCategories(),
    productRepository.getAll(),
  ]);

  const active = categories.some((c) => c.slug === rawCategory)
    ? (rawCategory as string)
    : null;

  const inCategory = active
    ? await productRepository.getByCategory(active)
    : all;

  // Facets describe the set being browsed, so the counts stay truthful.
  const facets = buildFacets(inCategory);
  const tagFacet = buildTagFacet(inCategory);
  const bounds = priceBounds(inCategory);
  const filters = parseFilters(params, facets);
  const products = applyFilters(inCategory, filters);

  const activeName = categories.find((c) => c.slug === active)?.name;
  const filtered = hasActiveFilters(filters);
  const gallery = active ? [] : await productRepository.getGalleryMedia(18);

  return (
    <>
      <PageHeader
        eyebrow="[ Product Gallery ]"
        title={activeName ?? "The full line."}
        lead={
          activeName
            ? undefined
            : "Every published SKU. Filter by category, availability, price and technical specification."
        }
      />

      <Container as="section" className="pb-28 lg:pb-40">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-16">
          <FilterSidebar
            categories={categories}
            activeCategory={active}
            facets={facets}
            tagFacet={tagFacet}
            bounds={bounds}
            filters={filters}
            params={params}
            resultCount={products.length}
          />

          <div>
            <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4 border-b border-hairline pb-4">
              <p className="p1-mono m-0 text-soft">
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
                {activeName ? ` in ${activeName}` : ""}
              </p>
              {filtered ? (
                <Link
                  href={active ? `/products?category=${active}` : "/products"}
                  className="p1-mono text-soft hover:text-signal"
                >
                  Clear filters ✕
                </Link>
              ) : null}
            </div>

            <ProductGrid
              products={products}
              columns={3}
              priorityCount={3}
              emptyMessage={
                filtered
                  ? "No products match these filters."
                  : "Nothing found in this category."
              }
            />
          </div>
        </div>
      </Container>

      {gallery.length > 0 ? <GalleryBand shots={gallery} /> : null}
      <ContactCTA />
    </>
  );
}
