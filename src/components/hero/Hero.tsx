"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { heroContent } from "@/data/site";
import type { ProductImage } from "@/types/product";
import { HeroChassis } from "./HeroChassis";
import { Waveform } from "./Waveform";

interface HeroProps {
  /** Product photography for the revolving chassis, resolved from Shopify. */
  chassisImage: ProductImage | null;
}

/**
 * Product-launch hero: two masked headline lines, one line of supporting
 * copy, two CTAs. The headline waits for the preload curtain so the reveal
 * is never spent behind it.
 */
export function Hero({ chassisImage }: HeroProps) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = window.sessionStorage.getItem("p1-seen") === "1";
    } catch {
      seen = true;
    }
    if (seen) {
      setPlay(true);
      return;
    }
    const onReady = () => setPlay(true);
    window.addEventListener("p1:ready", onReady, { once: true });
    return () => window.removeEventListener("p1:ready", onReady);
  }, []);

  const line = (index: number) => ({
    display: "block",
    transform: play ? "translateY(0)" : "translateY(100%)",
    transition: `transform 900ms var(--e-signal) ${index * 90}ms`,
  });

  return (
    <section
      aria-label="PRO1ST — professional audio equipment"
      className="relative flex min-h-[640px] flex-col justify-center overflow-hidden gutter-x pt-[120px] h-svh"
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

      {chassisImage ? (
        <HeroChassis image={chassisImage.src} alt={chassisImage.alt} />
      ) : null}

      <div className="p1-shell relative z-[2]">
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

        <p className="p1-lead mt-8 max-w-[52ch]">{heroContent.lead}</p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Magnetic>
            <ButtonLink href="/arsenal" variant="primary">
              Enter the arsenal ↓
            </ButtonLink>
          </Magnetic>
          <Magnetic>
            <ButtonLink href="/contact?enquiry=dealer" variant="outline">
              Talk to a dealer
            </ButtonLink>
          </Magnetic>
        </div>
      </div>

      <Waveform />

      <div className="p1-mono absolute bottom-10 right-[var(--gutter)] z-[2] hidden text-right text-soft md:block">
        {heroContent.meta}
      </div>
    </section>
  );
}
