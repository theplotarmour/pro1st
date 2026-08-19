import { Container } from "@/components/ui/Container";
import { Counter } from "@/components/ui/Counter";
import { ParallaxMedia } from "@/components/ui/ParallaxMedia";
import { Reveal } from "@/components/ui/Reveal";
import { originCopy } from "@/data/editorial";
import { stats } from "@/data/site";

interface OriginSectionProps {
  /** Homepage uses h2; the Origin page promotes it to h1. */
  as?: "h1" | "h2";
  showEyebrow?: boolean;
}

/** Brand introduction — the story block plus the four trade figures. */
export function OriginSection({
  as: Heading = "h2",
  showEyebrow = true,
}: OriginSectionProps) {
  return (
    <Container as="section" id="origin" className="py-28 lg:py-40">
      <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[7fr_5fr] lg:gap-20">
        <Reveal>
          {showEyebrow ? (
            <div className="p1-eyebrow mb-7">{originCopy.eyebrow}</div>
          ) : null}
          <Heading className="p1-h2 max-w-[16ch]">
            {originCopy.heading}
          </Heading>
          {originCopy.body.map((paragraph: string, index: number) => (
            <p
              key={index}
              className={`p1-body max-w-[58ch] ${index === 0 ? "mt-9" : "mt-5"}`}
            >
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal className="relative">
          <div
            aria-hidden="true"
            className="absolute -bottom-4 -right-4 left-4 top-4 border border-sig-40"
          />
          <ParallaxMedia
            src={originCopy.image.src}
            alt={originCopy.image.alt}
          />
        </Reveal>
      </div>

      <div className="mt-16 grid grid-cols-2 border-t border-hairline lg:mt-24 lg:grid-cols-4">
        {stats.map((stat) => (
          <Counter
            key={stat.label}
            to={stat.to}
            suffix={stat.suffix}
            initial={stat.initial}
            label={stat.label}
          />
        ))}
      </div>
    </Container>
  );
}
