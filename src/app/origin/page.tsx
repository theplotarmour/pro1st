import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { EventsSection } from "@/components/sections/EventsSection";
import { Manifesto } from "@/components/sections/Manifesto";
import { OriginSection } from "@/components/sections/OriginSection";
import { QualityStandards } from "@/components/sections/QualityStandards";
import { ShowroomSection } from "@/components/sections/ShowroomSection";
import { TrustBar } from "@/components/sections/TrustBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCraftPanels, getOriginImage } from "@/lib/content/sections";

/** Imagery comes from Shopify products; see the note on src/app/page.tsx. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "PRO1ST is the professional line of Desire Electronics, trading in audio from Chandni Chowk, Delhi since 2004. How the gear is built, and where to find us.",
  alternates: { canonical: "/origin" },
  openGraph: {
    title: "Our Story · PRO1ST",
    description:
      "PRO1ST is the professional line of Desire Electronics, trading in audio from Chandni Chowk, Delhi since 2004.",
    url: "/origin",
  },
};

/**
 * Our Story — heritage, quality standards, trade figures and the showroom.
 * The former /craft route was folded in here; it had no commercial context of
 * its own and split the brand narrative across two pages.
 */
export default async function OriginPage() {
  const [image, panels] = await Promise.all([
    getOriginImage(),
    getCraftPanels(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="[ Our story ]"
        title="Built in Delhi-6."
        lead="Desire Electronics has traded in audio since 2004. PRO1ST is the professional line."
      />
      <OriginSection image={image} as="h2" showEyebrow={false} />
      <QualityStandards panels={panels} />
      <TrustBar />
      <EventsSection />
      <Manifesto />
      <ShowroomSection />
      <ContactCTA />
    </>
  );
}
