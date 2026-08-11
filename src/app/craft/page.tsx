import type { Metadata } from "next";
import { BuildSection } from "@/components/sections/BuildSection";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { CraftSection } from "@/components/sections/CraftSection";
import { TrustBar } from "@/components/sections/TrustBar";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Craft",
  description:
    "Imported precision, in-house backbone: how PRO1st compression drivers, amplifier chassis and cabinets are specified, assembled and tested.",
  alternates: { canonical: "/craft" },
  openGraph: {
    title: "Craft · PRO1ST",
    description:
      "Imported precision, in-house backbone: how PRO1st compression drivers, amplifier chassis and cabinets are specified, assembled and tested.",
    url: "/craft",
  },
};

export default function CraftPage() {
  return (
    <>
      <PageHeader
        eyebrow="[ 05 — Craft ]"
        title="Imported precision. In-house backbone."
        lead="We buy the components nobody should improvise, and we build the parts that decide whether a cabinet survives a monsoon load-in."
      />
      <CraftSection />
      <BuildSection />
      <TrustBar />
      <ContactCTA />
    </>
  );
}
