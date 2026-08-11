import type { Metadata } from "next";
import { ArsenalSection } from "@/components/sections/ArsenalSection";
import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { PageHeader } from "@/components/ui/PageHeader";
import { getArsenalProducts, productRepository } from "@/lib/products";

export const metadata: Metadata = {
  title: "Arsenal",
  description:
    "The PRO1ST flagship line-up — mixers, amplifiers, compression drivers, speakers and processors engineered to interlock.",
  alternates: { canonical: "/arsenal" },
  openGraph: {
    title: "Arsenal · PRO1ST",
    description:
      "The PRO1ST flagship line-up — mixers, amplifiers, compression drivers, speakers and processors engineered to interlock.",
    url: "/arsenal",
  },
};

/**
 * Arsenal is the flagship line-up plus the shape of the range.
 *
 * It deliberately does NOT reuse the homepage's pinned signal chain: a 360vh
 * scroll-jacked section on a secondary page makes the site feel like one
 * endless page rather than a catalogue you can navigate.
 */
export default async function ArsenalPage() {
  const [flagship, all, categories] = await Promise.all([
    getArsenalProducts(),
    productRepository.getAll(),
    productRepository.getCategories(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="[ Arsenal ]"
        title="The core line-up."
        lead="The units that define PRO1ST. Everything else in the catalogue is built to sit alongside them."
      />
      <ArsenalSection
        products={flagship}
        totalCount={all.length}
        eyebrow="[ Flagships ]"
        title="Reordered by professionals."
        tilt={false}
      />
      <CategoryGrid categories={categories} />
      <ContactCTA />
    </>
  );
}
