import { Hero } from "@/components/hero/Hero";
import { ArsenalSection } from "@/components/sections/ArsenalSection";
import { BuildSection } from "@/components/sections/BuildSection";
import { CategoryMarquee } from "@/components/sections/CategoryMarquee";
import { ChainSection } from "@/components/sections/ChainSection";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { CraftSection } from "@/components/sections/CraftSection";
import { FaqSection } from "@/components/sections/FaqSection";
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
 * scroll sections live. Interior pages get their own compositions — repeating
 * these here and there is what makes a multi-page site feel like one page.
 *
 * hero → marquee → build → origin → chain → arsenal → craft → manifesto →
 * trade → trust → support → showroom
 */
export default async function HomePage() {
  const [
    featured,
    all,
    heroImage,
    marquee,
    build,
    origin,
    chain,
    craft,
  ] = await Promise.all([
    getFeaturedProducts(),
    productRepository.getAll(),
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
      <CraftSection panels={craft} />
      <Manifesto />
      <ContactCTA />
      <TrustBar />
      <FaqSection />
      <ShowroomSection />
    </>
  );
}
