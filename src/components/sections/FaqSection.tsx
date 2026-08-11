"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { contact, faqs } from "@/data/site";

/** Support accordion. One panel open at a time, as in the design. */
export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Container as="section" id="faq" className="py-24 lg:py-32">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
        <div className="lg:sticky lg:top-[120px]">
          <div className="p1-eyebrow mb-6">[ Support ]</div>
          <h2 className="p1-h2">Questions we get on the phone.</h2>
          <p className="mt-6 max-w-[38ch] text-base leading-[1.6] text-muted">
            If it isn&apos;t here, call{" "}
            <a href={contact.phoneHref} className="text-ash hover:text-signal">
              {contact.phone}
            </a>
            . Someone picks up.
          </p>
        </div>

        <div className="border-t border-hairline">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div
                key={faq.q}
                className="border-b border-hairline border-l-2 transition-[border-color,padding] duration-[420ms] ease-signal"
                style={{
                  borderLeftColor: isOpen ? "var(--p1-signal)" : "transparent",
                  paddingLeft: isOpen ? 20 : 0,
                }}
              >
                <h3 className="m-0">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    id={`faq-trigger-${index}`}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 border-0 bg-transparent py-6 text-left font-display text-lg font-medium tracking-[-0.01em] text-strong hover:text-signal"
                  >
                    <span>{faq.q}</span>
                    <span
                      aria-hidden="true"
                      className="relative h-3.5 w-3.5 flex-none transition-transform duration-[420ms] ease-signal"
                      style={{ transform: `rotate(${isOpen ? 90 : 0}deg)` }}
                    >
                      <span className="absolute left-0 top-[6.5px] h-px w-3.5 bg-current" />
                      <span
                        className="absolute left-[6.5px] top-0 h-3.5 w-px bg-current"
                        style={{ opacity: isOpen ? 0 : 1 }}
                      />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${index}`}
                  className="grid transition-[grid-template-rows,opacity] duration-[420ms] ease-signal"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="m-0 max-w-[62ch] pb-7 pr-10 text-base leading-[1.6] text-body">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
