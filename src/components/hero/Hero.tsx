"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { SonicWaveform } from "@/components/ui/sonic-waveform";
import { heroContent } from "@/data/site";



/**
 * Hero: the waveform behind a dark blurred veil, with the headline, lead and
 * CTAs stacked in the centre of the viewport on top of it.
 *
 * The veil is a `backdrop-filter` layer rather than a flat scrim. A scrim
 * alone can only be made readable by turning it up until the ribbon is gone;
 * a light blur softens the fine strokes that were competing with the type, so
 * much less darkening is needed and the ribbon keeps its shape. Deliberately
 * kept minor — 5px, enough to settle the detail behind the text and no more.
 * It sits between the canvas and the copy, and is masked to stay strongest
 * behind the text and clear at the edges of the frame.
 */
export function Hero() {
  const [play, setPlay] = useState(false);

  // Plays on mount. There is no preload curtain to wait for any more — the
  // headline is readable as soon as the document paints.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // 160%, not 100%: the clip box is padded out past the line box to fit the
  // display face (see below), so a 100% offset would leave the line peeking
  // into that padding before it animates in.
  const line = (index: number) => ({
    display: "block",
    transform: play ? "translateY(0)" : "translateY(160%)",
    transition: `transform 900ms var(--e-signal) ${index * 90}ms`,
  });

  return (
    <section
      aria-label="PRO1ST — professional audio equipment"
      className="relative flex min-h-[680px] flex-col items-center justify-center overflow-hidden gutter-x pb-24 pt-[112px] h-svh"
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

      <SonicWaveform />

      {/*
        The blurred veil. `backdrop-filter` blurs the canvas beneath it; the
        gradient on top supplies the darkening. Masked to fade out towards the
        frame edges so the ribbon still reads sharp where no text sits over it.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          background:
            "radial-gradient(ellipse 78% 62% at 50% 48%, color-mix(in srgb, var(--surface-base) 74%, transparent) 0%, color-mix(in srgb, var(--surface-base) 48%, transparent) 55%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 92% 78% at 50% 48%, #000 45%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 92% 78% at 50% 48%, #000 45%, transparent 100%)",
        }}
      />

      <div className="p1-shell relative z-[2] flex flex-col items-center text-center">
        {/*
          Each line is clipped so its reveal slides out of a hard edge. The
          clip box is the line box, which at line-height 0.88 is far shorter
          than Space Grotesk's ascender-to-descender extent — so it is padded
          out on both sides and pulled back by an equal negative margin, which
          buys the room without moving anything. Without it the display face is
          sheared off above the baseline.
        */}
        <h1 className="p1-h1">
          <span className="block overflow-hidden py-[0.24em] -my-[0.24em]">
            <span data-p1-hero-word="" style={line(0)}>
              {heroContent.headlineTop}
            </span>
          </span>
          <span className="block overflow-hidden py-[0.24em] -my-[0.24em]">
            <span data-p1-hero-word="" style={line(1)}>
              <span className="text-signal">{heroContent.headlineAccent}</span>{" "}
              {heroContent.headlineRest}
            </span>
          </span>
        </h1>

        <p className="p1-lead mt-8 max-w-[56ch]">{heroContent.lead}</p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Magnetic>
            <ButtonLink href="/products" variant="primary">
              Browse audio systems
            </ButtonLink>
          </Magnetic>
          <Magnetic>
            <ButtonLink href="/contact?enquiry=dealer" variant="outline">
              Apply for dealer pricing
            </ButtonLink>
          </Magnetic>
        </div>
      </div>

      <div className="p1-mono absolute bottom-10 right-[var(--gutter)] z-[2] hidden text-right text-soft md:block">
        {heroContent.meta}
      </div>
    </section>
  );
}
