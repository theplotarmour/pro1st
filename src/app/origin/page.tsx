import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { OriginSection } from "@/components/sections/OriginSection";
import { TrustBar } from "@/components/sections/TrustBar";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Origin",
  description:
    "PRO1st is the professional line of Desire Electronics, trading in audio from Chandni Chowk, Delhi since 2004.",
  alternates: { canonical: "/origin" },
  openGraph: {
    title: "Origin · PRO1ST",
    description:
      "PRO1st is the professional line of Desire Electronics, trading in audio from Chandni Chowk, Delhi since 2004.",
    url: "/origin",
  },
};

export default function OriginPage() {
  return (
    <>
      <PageHeader
        eyebrow="[ 02 — Origin ]"
        title="Built in Delhi-6."
        lead="Desire Electronics has traded in audio since 2004. PRO1st is the professional line."
      />
      <OriginSection as="h2" showEyebrow={false} />
      <TrustBar />
      <ContactCTA />
    </>
  );
}
