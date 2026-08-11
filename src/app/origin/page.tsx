import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { OriginSection } from "@/components/sections/OriginSection";
import { ShowroomSection } from "@/components/sections/ShowroomSection";
import { TrustBar } from "@/components/sections/TrustBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOriginImage } from "@/lib/content/sections";

export const metadata: Metadata = {
  title: "Origin",
  description:
    "PRO1ST is the professional line of Desire Electronics, trading in audio from Chandni Chowk, Delhi since 2004.",
  alternates: { canonical: "/origin" },
  openGraph: {
    title: "Origin · PRO1ST",
    description:
      "PRO1ST is the professional line of Desire Electronics, trading in audio from Chandni Chowk, Delhi since 2004.",
    url: "/origin",
  },
};

/** Story, trade figures, and where to find us. */
export default async function OriginPage() {
  const image = await getOriginImage();

  return (
    <>
      <PageHeader
        eyebrow="[ Origin ]"
        title="Built in Delhi-6."
        lead="Desire Electronics has traded in audio since 2004. PRO1ST is the professional line."
      />
      <OriginSection image={image} as="h2" showEyebrow={false} />
      <TrustBar />
      <ShowroomSection />
      <ContactCTA />
    </>
  );
}
