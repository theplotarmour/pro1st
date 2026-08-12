import type { Metadata } from "next";
import { Suspense } from "react";
import { BulkOrderTable } from "@/components/commerce/BulkOrderTable";
import { DealerForm } from "@/components/sections/DealerForm";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { contact } from "@/data/site";
import { productRepository } from "@/lib/products";

/** Bulk-order table reads the live catalogue; see the note on src/app/page.tsx. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Wholesale",
  description:
    "Dealer and trade accounts for PRO1ST professional audio. Bulk quick-order across the full catalogue, dealer registration and PAN-India dispatch.",
  alternates: { canonical: "/wholesale" },
  openGraph: {
    title: "Wholesale · PRO1ST",
    description:
      "Dealer and trade accounts for PRO1ST professional audio equipment.",
    url: "/wholesale",
  },
};

/**
 * Wholesale portal.
 *
 * Two halves, and only one of them is blocked.
 *
 * The bulk quick-order table is real and works today: the whole catalogue as
 * an editable list, straight into the live Shopify cart. That is the piece
 * trade buyers actually use.
 *
 * Tiered dealer pricing and automated GSTIN verification are NOT built, and
 * are not faked here. Both need Shopify B2B (Plus) or a wholesale app plus the
 * client's own commercial terms. Registration therefore collects the details
 * and hands them to a person, which is honest and works from day one.
 */
export default async function WholesalePage() {
  const products = await productRepository.getAll();

  return (
    <>
      <PageHeader
        eyebrow="[ Trade ]"
        title="Stock PRO1ST."
        lead="Dealer margins, PAN-India dispatch and bulk pricing across the full line. Share a GSTIN and a first order to open an account."
      />

      <Container as="section" className="pb-24">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[7fr_5fr] lg:gap-20">
          <div>
            <h2 className="p1-mono mb-6 text-muted">Open a dealer account</h2>
            <Suspense
              fallback={
                <p className="p1-mono text-faint">Loading form…</p>
              }
            >
              <DealerForm />
            </Suspense>
          </div>

          <aside className="border border-hairline bg-panel p-7">
            <h2 className="p1-mono mb-5 text-muted">How it works</h2>
            <ol className="m-0 flex list-none flex-col gap-5 p-0">
              {[
                "Send your GSTIN, firm name and expected monthly volume.",
                "We verify the GSTIN and confirm your rate card, usually within one working day.",
                "Order here or over WhatsApp. Bulk quantities ship by road transport with insurance available.",
              ].map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="p1-mono flex-none text-signal">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-[1.6] text-body">
                    {step}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-7 border-t border-hairline pt-6">
              <p className="p1-mono normal-case leading-relaxed tracking-[0.04em] text-faint">
                GSTIN verification and tiered dealer pricing are handled by our
                team today, not automatically at checkout. Prices shown on this
                page are retail.
              </p>
              <a href={contact.phoneHref} className="p1-link mt-5 inline-flex">
                Or call {contact.phone}
              </a>
            </div>
          </aside>
        </div>
      </Container>

      <Container as="section" className="border-t border-hairline py-20 lg:py-28">
        <div className="mb-10">
          <div className="p1-eyebrow mb-5">[ Bulk quick order ]</div>
          <h2 className="p1-h2">The whole catalogue, one list.</h2>
          <p className="p1-body mt-5 max-w-[56ch]">
            Enter quantities across as many models as you need and add them to
            the cart in one action. Retail pricing shown; your dealer rate is
            applied when we confirm the order.
          </p>
        </div>

        <BulkOrderTable products={products} />
      </Container>
    </>
  );
}
