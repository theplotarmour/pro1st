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
import { IMG } from "@/data/images";
import { bestSellerHandles } from "@/data/products";
import { productRepository } from "@/lib/products";

/**
 * The homepage is the brand experience, not a grid with a hero on top:
 * hero → build → origin → chain → arsenal → craft → manifesto → trade →
 * support → showroom.
 */
export default async function HomePage() {
  const [featured, all] = await Promise.all([
    productRepository.getByHandles(bestSellerHandles),
    productRepository.getAll(),
  ]);

  return (
    <>
      <Hero
        chassisImage={IMG.aj6}
        chassisAlt="AJ6 professional audio mixer"
      />
      <CategoryMarquee />
      <BuildSection />
      <OriginSection />
      <ChainSection />
      <ArsenalSection products={featured} totalCount={all.length} />
      <CraftSection />
      <Manifesto />
      <ContactCTA />
      <TrustBar />
      <FaqSection />
      <ShowroomSection />
    </>
  );
}
