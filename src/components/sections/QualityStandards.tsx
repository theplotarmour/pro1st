import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { Container } from "@/components/ui/Container";
import type { CraftPanel } from "@/lib/content/sections";

/**
 * "Our Quality Standards".
 *
 * The old /craft route was an engineering essay with no commercial context —
 * a shopper had no idea why they were reading it. The same material now sits
 * inside the brand story, in plain English, where it does the job it was
 * always meant to do: explain why the gear is worth the money.
 */
export function QualityStandards({ panels }: { panels: CraftPanel[] }) {
  if (panels.length === 0) return null;

  return (
    <Container as="section" id="quality" className="border-t border-hairline py-28 lg:py-40">
      <Reveal className="mb-16 lg:mb-20">
        <div className="p1-eyebrow mb-5">[ Our quality standards ]</div>
        <h2 className="p1-h2 max-w-[20ch]">How the gear is actually built.</h2>
      </Reveal>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
        {panels.map((panel, index) => (
          <Reveal key={panel.title} delay={index * 80}>
            <div className="relative mb-6 aspect-[4/3] overflow-hidden border border-hairline bg-panel">
              {panel.image ? (
                <Media
                  src={panel.image.src}
                  alt={panel.image.alt || panel.title}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : null}
            </div>
            <h3 className="m-0 font-display text-[19px] font-medium tracking-[-0.01em] text-strong">
              {panel.title}
            </h3>
            <p className="p1-body mt-3">{panel.body}</p>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}
