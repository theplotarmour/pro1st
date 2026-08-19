import type { Metadata } from "next";
import { Suspense } from "react";
import { DealerForm } from "@/components/sections/DealerForm";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { contact } from "@/data/site";

export const metadata: Metadata = {
  title: "Wholesale",
  description:
    "Dealer and trade accounts for PRO1ST professional audio. Dealer registration, rate cards on request and PAN-India dispatch. Trade orders are placed over WhatsApp or email.",
  alternates: { canonical: "/wholesale" },
  openGraph: {
    title: "Wholesale · PRO1ST",
    description:
      "Dealer and trade accounts for PRO1ST professional audio equipment.",
    url: "/wholesale",
  },
};

/** The routes a trade order can actually be placed through. */
const channels = [
  {
    label: "WhatsApp",
    value: contact.whatsappLabel,
    href: contact.whatsappHref,
    external: true,
  },
  {
    label: "Email",
    value: contact.email,
    href: `mailto:${contact.email}?subject=${encodeURIComponent("Wholesale order — PRO1ST")}`,
  },
  { label: "Phone", value: contact.phone, href: contact.phoneHref },
];

/**
 * Wholesale portal.
 *
 * Registration collects the details a rate card needs and hands them to a
 * person. Tiered dealer pricing and automated GSTIN verification are NOT
 * built and are not faked here — both need Shopify B2B (Plus) or a wholesale
 * app plus the client's own commercial terms.
 *
 * There is deliberately no self-serve bulk order path. The quick-order table
 * that used to sit at the foot of this page let a trade buyer push the whole
 * catalogue into the retail cart at retail prices, which is not what a
 * wholesale order is: the price depends on the account, the freight depends
 * on the consignment, and both are settled by a person. Offering a checkout
 * that cannot honour either was promising something the business does not do.
 * Orders go through WhatsApp or email instead. It is removed rather than
 * hidden, so nothing has to be kept working for a path nobody takes.
 */
export default function WholesalePage() {
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
                "Send your order over WhatsApp or email. Bulk quantities ship by road transport with insurance available.",
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
                team, not automatically at checkout. Prices shown elsewhere on
                this site are retail.
              </p>
              <a href={contact.phoneHref} className="p1-link mt-5 inline-flex">
                Or call {contact.phone}
              </a>
            </div>
          </aside>
        </div>
      </Container>

      {/*
        Where the bulk table was. The page still has to answer "so how do I
        place the order" — leaving it unanswered is what would send a dealer
        to the retail cart, which is the thing being removed.
      */}
      <Container
        as="section"
        id="ordering"
        className="border-t border-hairline py-20 lg:py-28"
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[7fr_5fr] lg:gap-20">
          <div>
            <div className="p1-eyebrow mb-5">[ Placing an order ]</div>
            <h2 className="p1-h2">Trade orders go through a person.</h2>
            <p className="p1-body mt-5 max-w-[56ch]">
              There is no wholesale checkout, by design. Your rate depends on
              your account and your freight depends on the consignment, so send
              the model numbers and quantities over WhatsApp or email and we
              confirm pricing, stock and dispatch against them.
            </p>
          </div>

          <div className="flex flex-col self-start border-t border-hairline">
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                {...(channel.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="p1-mono flex justify-between gap-4 border-b border-hairline py-[18px] transition-colors duration-[120ms] ease-signal hover:text-signal"
              >
                <span className="text-soft">{channel.label}</span>
                <span>{channel.value}</span>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
