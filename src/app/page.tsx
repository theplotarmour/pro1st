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
 * hero → marquee → build → origin → chain → arsenal → ecosystem → gallery →
 * craft → manifesto → trade → trust → support → showroom
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
      <CategoryMarquee items={marquee} />
      {build ? <BuildSection unit={build} /> : null}
      <OriginSection image={origin} />
      {chain.length > 0 ? <ChainSection nodes={chain} /> : null}
      <ArsenalSection products={featured} totalCount={all.length} />
      <CategoryGrid
        categories={categories}
        eyebrow="[ The ecosystem ]"
        title="Shop the range."
      />
      <GalleryBand shots={gallery} />
      <CraftSection panels={craft} />
      <Manifesto />
      <ContactCTA />
      <TrustBar />
      <FaqSection />
      <ShowroomSection />
    </>
  );
}
