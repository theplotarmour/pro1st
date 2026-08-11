import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { productRepository } from "@/lib/products";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the PRO1st catalogue by product name, SKU or category.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

/**
 * A plain GET form: the query lives in the URL, results render on the
 * server, and the page works with JavaScript disabled. Typeahead can come
 * later, when the Shopify catalogue is big enough to need it.
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await productRepository.search(query) : [];

  return (
    <>
      <PageHeader
        eyebrow="[ Search ]"
        title="Find the unit."
        lead="Search by product name, SKU, category or tag."
      />

      <Container as="section" className="pb-24 lg:pb-32">
        <form action="/search" method="get" role="search" className="max-w-xl">
          <label htmlFor="search-input" className="p1-label">
            Search the catalogue
          </label>
          <div className="flex gap-3">
            <input
              id="search-input"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="AJ6, amplifier, XLR…"
              autoComplete="off"
              className="p1-field"
            />
            <button type="submit" className="p1-btn p1-btn--primary">
              Search
            </button>
          </div>
        </form>

        <div className="mt-14">
          {query ? (
            <>
              <p className="p1-mono mb-10 text-soft">
                {results.length}{" "}
                {results.length === 1 ? "result" : "results"} for
                &ldquo;{query}&rdquo;
              </p>
              <ProductGrid
                products={results}
                emptyMessage="No products matched your search."
              />
            </>
          ) : (
            <p className="p1-mono text-faint">
              Enter a search term to begin.
            </p>
          )}
        </div>
      </Container>
    </>
  );
}
