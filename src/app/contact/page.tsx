import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/sections/ContactForm";
import { FaqSection } from "@/components/sections/FaqSection";
import { ShowroomSection } from "@/components/sections/ShowroomSection";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Get in Touch",
  description:
    "General, product, dealer and business enquiries for PRO1st professional audio equipment.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Get in Touch · PRO1ST",
    description:
      "General, product, dealer and business enquiries for PRO1st professional audio equipment.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="[ Get in Touch ]"
        title="Tell us the room."
        lead="Dealers, installers, event professionals and retailers — send the details and we will come back with a chain that interlocks."
      />

      <Container as="section" className="pb-24 lg:pb-32">
        <div className="max-w-3xl">
          <Suspense
            fallback={
              <p className="p1-mono text-[rgba(230,230,230,0.35)]">
                Loading form…
              </p>
            }
          >
            <ContactForm />
          </Suspense>
        </div>
      </Container>

      <ShowroomSection />
      <FaqSection />
    </>
  );
}
