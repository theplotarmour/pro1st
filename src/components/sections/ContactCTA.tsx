import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { tradeContent } from "@/data/site";

/**
 * The two trade routes: stock the line, or have a system specced.
 * The halves shear against each other on hover — CSS only.
 */
export function ContactCTA() {
  return (
    <section
      id="dealers"
      aria-label="Trade and systems enquiries"
      className="group grid grid-cols-1 border-t border-hairline lg:grid-cols-2"
    >
      <div className="bg-signal text-ink transition-transform duration-[420ms] ease-signal gutter-x py-20 lg:py-24 lg:group-hover:-translate-y-2 motion-reduce:transform-none">
        <div className="p1-mono mb-6 opacity-60">
          {tradeContent.dealer.eyebrow}
        </div>
        <h2 className="p1-h-xl">{tradeContent.dealer.heading}</h2>
        <p className="mb-10 mt-7 max-w-[42ch] text-[clamp(16px,1.4vw,18px)] leading-[1.55] text-[rgba(13,13,15,0.78)]">
          {tradeContent.dealer.body}
        </p>
        <Magnetic>
          <ButtonLink href="/contact?enquiry=dealer" variant="dark">
            {tradeContent.dealer.cta}
          </ButtonLink>
        </Magnetic>
      </div>

      <div className="border-t border-hairline bg-ink transition-transform duration-[420ms] ease-signal gutter-x py-20 lg:border-l lg:border-t-0 lg:py-24 lg:group-hover:translate-y-2 motion-reduce:transform-none">
        <div className="p1-mono mb-6 text-[rgba(230,230,230,0.45)]">
          {tradeContent.systems.eyebrow}
        </div>
        <h2 className="p1-h-xl text-white">{tradeContent.systems.heading}</h2>
        <p className="p1-lead mb-10 mt-7 max-w-[42ch]">
          {tradeContent.systems.body}
        </p>
        <Magnetic>
          <ButtonLink href="/contact?enquiry=business" variant="outline">
            {tradeContent.systems.cta}
          </ButtonLink>
        </Magnetic>
      </div>
    </section>
  );
}
