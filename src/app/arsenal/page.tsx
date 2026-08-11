import type { Metadata } from "next";
import { ChainSection } from "@/components/sections/ChainSection";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ArsenalSection } from "@/components/sections/ArsenalSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { getArsenalProducts, productRepository } from "@/lib/products";

export const metadata: Metadata = {
  title: "Arsenal",
  description:
    "The PRO1st flagship line-up — mixers, amplifiers, compression drivers, speakers and processors engineered to interlock.",
  alternates: { canonical: "/arsenal" },
  openGraph: {
    title: "Arsenal · PRO1ST",
    description:
      "The PRO1st flagship line-up — mixers, amplifiers, compression drivers, speakers and processors engineered to interlock.",
    url: "/arsenal",
  },
};

export default async function ArsenalPage() {
  const [flagship, all] = await Promise.all([
    getArsenalProducts(),
    productRepository.getAll(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="[ Arsenal ]"
        title="The core ecosystem."
        lead="Six units that define the line. Every other product in the catalogue is built to sit alongside them."
      />
      <ArsenalSection
        products={flagship}
        totalCount={all.length}
        eyebrow="[ Flagships ]"
        title="Reordered by professionals."
        tilt={false}
      />
      <ChainSection />
      <ContactCTA />
    </>
  );
}
