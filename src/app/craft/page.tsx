import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { BuildSection } from "@/components/sections/BuildSection";
import { CraftSection } from "@/components/sections/CraftSection";
import { TrustBar } from "@/components/sections/TrustBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { getBuildUnit, getCraftPanels } from "@/lib/content/sections";

export const metadata: Metadata = {
  title: "Craft",
  description:
    "Imported precision, in-house backbone: how PRO1ST compression drivers, amplifier chassis and cabinets are specified, assembled and tested.",
  alternates: { canonical: "/craft" },
  openGraph: {
    title: "Craft · PRO1ST",
    description:
      "Imported precision, in-house backbone: how PRO1ST compression drivers, amplifier chassis and cabinets are specified, assembled and tested.",
    url: "/craft",
  },
};

/**
 * Craft reads as an engineering editorial.
 *
 * The panels are the same content as the homepage's horizontal traverse, but
 * composed as a stacked column — and the 620vh exploded-assembly section stays
 * on the homepage where it belongs. Two scroll-jacked sections back to back
 * made this page nine screens of hijacked scrolling.
 */
export default async function CraftPage() {
  const [panels, build] = await Promise.all([getCraftPanels(), getBuildUnit()]);

  return (
    <>
      <PageHeader
        eyebrow="[ Craft ]"
        title="Imported precision. In-house backbone."
        lead="We buy the components nobody should improvise, and we build the parts that decide whether a cabinet survives a monsoon load-in."
      />
      <CraftSection panels={panels} layout="stacked" />
      {build ? <BuildSection unit={build} /> : null}
      <TrustBar />
      <ContactCTA />
    </>
  );
}
