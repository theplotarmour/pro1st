import { Hero } from "@/components/hero/Hero";
import { ArsenalSection } from "@/components/sections/ArsenalSection";
import { BuildSection } from "@/components/sections/BuildSection";
import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { CategoryMarquee } from "@/components/sections/CategoryMarquee";
import { ChainSection } from "@/components/sections/ChainSection";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { CraftSection } from "@/components/sections/CraftSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { GalleryBand } from "@/components/sections/GalleryBand";
import { Manifesto } from "@/components/sections/Manifesto";
import { OriginSection } from "@/components/sections/OriginSection";
import { ShowroomSection } from "@/components/sections/ShowroomSection";
import { TrustBar } from "@/components/sections/TrustBar";
import {
  getBuildUnit,
  getChainNodes,
  getCraftPanels,
  getHeroUnit,
  getMarqueeItems,
  getOriginImage,
} from "@/lib/content/sections";
import { getFeaturedProducts, productRepository } from "@/lib/products";

/**
 * The homepage is the brand experience, and the only place the three pinned
 * scroll sections live. Interior pages get their own compositions.
 *
 * Order follows COMPETITOR-RESEARCH.md: product first, brand second. Fifteen
 * competitor homepages were surveyed and every one leads with a product and
 * puts a category grid within the first two screens. The pinned scroll
 * sections are kept — no competitor has anything like them — but they now sit
 * below the point where a buyer has seen the catalogue.
 */
export default async function HomePage() {
  const [
    featured,
    all,
    categories,
    gallery,
    heroImage,
    marquee,
    build,
    origin,
    chain,
    craft,
  ] = await Promise.all([
    // 12 rather than 8 — the range is the story on a catalogue homepage.
    getFeaturedProducts(undefined, 12),
    productRepository.getAll(),
    productRepository.getCategories(),
    productRepository.getGalleryMedia(24),
    getHeroUnit(),
    getMarqueeItems(),
    getBuildUnit(),
    getOriginImage(),
    getChainNodes(),
    getCraftPanels(),
  ]);

  return (
    <>
      <Hero chassisImage={heroImage} />

      {/* Trust strip directly under the hero — the pattern RCF and Shure both
          use to answer "can I rely on these people" before anything else. */}
      <TrustBar />

      {/* Products within the first two screens. Every one of the fifteen
          competitors surveyed does this; the previous order put the first
          product on roughly the sixth screen, behind an animation. */}
      <CategoryGrid
        categories={categories}
        eyebrow="[ Shop the range ]"
        title="Every link in the chain."
      />
      <ArsenalSection products={featured} totalCount={all.length} />
      <CategoryMarquee items={marquee} />
      <GalleryBand shots={gallery} />

      {/* The differentiators. Kept — no competitor has them — but moved below
          the point where a buyer has already seen what is for sale. */}
      {chain.length > 0 ? <ChainSection nodes={chain} /> : null}
      {build ? <BuildSection unit={build} /> : null}

      {/* Credibility and brand close. */}
      <OriginSection image={origin} />
      <CraftSection panels={craft} />
      <Manifesto />
      <ContactCTA />
      <FaqSection />
      <ShowroomSection />
    </>
  );
}
