"use client";

import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { SonicWaveform } from "@/components/ui/sonic-waveform";
import { heroContent } from "@/data/site";
import { useGsapContext } from "@/lib/motion/gsap";



/**
 * Hero: the waveform behind a dark blurred veil, with the headline, lead and
 * CTAs stacked in the centre of the viewport on top of it.
 *
 * Two layers sit between the ribbon and the copy: the ribbon is blurred on
 * its own layer (see below), and a masked gradient supplies the darkening,
 * strongest behind the text and clear at the frame edges.
 */
export function Hero() {
  // The reveal is a CSS animation (`.p1-hero-line`), so the headline does not
  // wait on hydration to become visible — only the stagger is set here.
  const line = (index: number) => ({
    animationDelay: `${index * 90}ms`,
  });

  /*
    Depth on exit. Scrubbed against the first screen of scroll: the copy lifts
    and fades while the ribbon behind it lifts at a third of the rate. Two
    planes moving at different speeds is what separates them; without it the
    hero is a flat card that slides off.

    Scrubbed rather than triggered, so it is reversible and tracks the scroll
    position exactly — nothing plays at you, it only responds. `end` is one
    viewport, so it is finished by the time the trust bar arrives.

    `scrub: true`, not a number. A numeric scrub eases toward the scroll
    position over that many seconds, and Lenis is already easing the scroll
    itself — two lags in series, which is felt as the hero sliding around
    loosely behind the page rather than being attached to it. Lenis supplies
    the weight; this just follows.
  */
  const sceneRef = useGsapContext<HTMLElement>((gsap, scope) => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      })
      .to(
        scope.querySelector("[data-hero-copy]"),
        { y: -80, opacity: 0, ease: "none" },
        0,
      )
      .to(
        scope.querySelector("[data-hero-stage]"),
        { y: -26, ease: "none" },
        0,
      );
  });

  return (
    <section
      ref={sceneRef}
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

      {/*
        The blur is on the ribbon itself, not on a `backdrop-filter` above it.

        Both look the same at this radius, and the cost is not close. A
        full-viewport backdrop filter has to re-sample everything beneath it
        every time that backdrop changes, and the backdrop here is a canvas
        repainting continuously — a whole-screen filter every frame, for as
        long as the hero is on screen. Filtering the canvas layer instead is
        one already-composited surface, blurred once per repaint.
      */}
      <div
        data-hero-stage=""
        className="pointer-events-none absolute inset-0 z-0"
        style={{ filter: "blur(5px)" }}
      >
        <SonicWaveform />
      </div>

      {/* The veil. Masked to fade out towards the frame edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 78% 62% at 50% 48%, color-mix(in srgb, var(--surface-base) 74%, transparent) 0%, color-mix(in srgb, var(--surface-base) 48%, transparent) 55%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 92% 78% at 50% 48%, #000 45%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 92% 78% at 50% 48%, #000 45%, transparent 100%)",
        }}
      />

      <div
        data-hero-copy=""
        className="p1-shell relative z-[2] flex flex-col items-center text-center"
      >
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
            <span data-p1-hero-word="" className="p1-hero-line" style={line(0)}>
              {heroContent.headlineTop}
            </span>
          </span>
          <span className="block overflow-hidden py-[0.24em] -my-[0.24em]">
            <span data-p1-hero-word="" className="p1-hero-line" style={line(1)}>
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
