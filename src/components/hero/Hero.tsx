"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { heroContent } from "@/data/site";
import type { HeroUnit } from "@/lib/content/sections";
import { HeroChassis } from "./HeroChassis";
import { Waveform } from "./Waveform";

interface HeroProps {
  /** Product photography for the revolving chassis, resolved from Shopify. */
  chassisImage: HeroUnit | null;
}

/**
 * Product-launch hero: two masked headline lines, one line of supporting
 * copy, two CTAs, and the flagship unit priced and linked.
 */
export function Hero({ chassisImage }: HeroProps) {
  const [play, setPlay] = useState(false);

  // Plays on mount. There is no preload curtain to wait for any more — the
  // headline is readable as soon as the document paints.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const line = (index: number) => ({
    display: "block",
    transform: play ? "translateY(0)" : "translateY(100%)",
    transition: `transform 900ms var(--e-signal) ${index * 90}ms`,
  });

  return (
    <section
      aria-label="PRO1ST — professional audio equipment"
      className="relative flex min-h-[680px] flex-col justify-center overflow-hidden gutter-x pb-[30vh] pt-[112px] h-svh"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[10%] -right-[8%] h-[70vw] w-[70vw] opacity-[0.055]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 62% 34%,rgba(255,106,0,0) 0 46px,rgba(255,106,0,1) 46px 47px),repeating-radial-gradient(circle at 30% 66%,rgba(255,106,0,0) 0 58px,rgba(255,106,0,1) 58px 59px)",
          maskImage:
            "radial-gradient(circle at 62% 30%,#000 20%,transparent 68%)",
          WebkitMaskImage:
            "radial-gradient(circle at 62% 30%,#000 20%,transparent 68%)",
        }}
      />

      <div className="p1-shell relative z-[2] grid items-center gap-10 min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]">
        <div>
        <div className="p1-mono mb-8 flex items-center gap-2.5 text-muted">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-signal"
            style={{ animation: "p1-blink 1.8s infinite" }}
          />
          {heroContent.status}
        </div>

        <h1 className="p1-h1">
          <span className="block overflow-hidden">
            <span data-p1-hero-word="" style={line(0)}>{heroContent.headlineTop}</span>
          </span>
          <span className="block overflow-hidden">
            <span data-p1-hero-word="" style={line(1)}>
              <span className="text-signal">{heroContent.headlineAccent}</span>{" "}
              {heroContent.headlineRest}
            </span>
          </span>
        </h1>

        <p className="p1-lead mt-7 max-w-[46ch]">{heroContent.lead}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Magnetic>
            <ButtonLink href="/products" variant="primary">
              Shop the range
            </ButtonLink>
          </Magnetic>
          <Magnetic>
            <ButtonLink href="/contact?enquiry=dealer" variant="outline">
              Talk to a dealer
            </ButtonLink>
          </Magnetic>
        </div>
        </div>

        {chassisImage ? <HeroChassis unit={chassisImage} /> : null}
      </div>

      <Waveform />

      <div className="p1-mono absolute bottom-10 right-[var(--gutter)] z-[2] hidden text-right text-soft md:block">
        {heroContent.meta}
      </div>
    </section>
  );
}
