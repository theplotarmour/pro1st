import { Hero } from "@/components/hero/Hero";
import { ArsenalSection } from "@/components/sections/ArsenalSection";
import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { ChainSection } from "@/components/sections/ChainSection";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { OriginSection } from "@/components/sections/OriginSection";
import { TrustBar } from "@/components/sections/TrustBar";
import { getChainNodes } from "@/lib/content/sections";
import { getFeaturedProducts, productRepository } from "@/lib/products";

/**
 * Re-render at most every five minutes, matching the product pages.
 *
 * Without this the page is prerendered once at build and frozen: swapping a
 * product image in Shopify would not appear here until the next deploy, even
 * though the same image updates on /products within minutes. Five minutes is
 * the same window the catalogue routes already use.
 */
export const revalidate = 300;

/**
 * Homepage.
 *
 * Rebuilt around what the research actually shows (COMPETITOR-RESEARCH.md):
 * competitors lead with CATEGORIES, not individual products, and they are
 * ruthlessly sparse. Behringer's category tiles carry two or three words and a
 * count. Genelec's entire first screen is a single hero. Neither runs a brand
 * manifesto in the opening screens.
 *
 * This page previously carried fourteen sections, twelve product cards, a
 * twenty-four tile image wall, a marquee and three pinned scroll sequences.
 * That is why it read as chaotic. Seven sections now, each with one job:
 *
 *   hero → trust → categories → featured → the chain → origin → trade
 *
 * Everything removed still exists, on the page where it belongs: the image
 * wall on /products, the exploded build on /craft, the manifesto on /origin,
 * the FAQ and showroom on /contact. Nothing was deleted — it was filed.
 */
export default async function HomePage() {
  const [featured, all, categories, chain] =
    await Promise.all([
      // Four, not twelve. One clean row that reads as a selection rather than
      // an inventory dump; the catalogue itself is one click away.
      getFeaturedProducts(undefined, 4),
      productRepository.getAll(),
      productRepository.getCategories(),
      getChainNodes(),
    ]);

  return (
    <>
      <Hero />
      <TrustBar />

      {/* The primary browse path, and the first thing after the fold. */}
      <CategoryGrid
        categories={categories}
        eyebrow="[ Shop the range ]"
        title="Start with the category."
      />

      <ArsenalSection
        products={featured}
        totalCount={all.length}
        eyebrow="[ Flagships ]"
        title="What professionals reorder."
        tilt={false}
      />

      {/* One editorial moment, not four. The chain is the differentiator —
          no competitor surveyed has anything like it. */}
      {chain.length > 0 ? <ChainSection nodes={chain} /> : null}

      <OriginSection />
      <ContactCTA />
    </>
  );
}
