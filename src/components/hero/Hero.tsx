"use client";

import { HeroProductVideo } from "@/components/hero/HeroProductVideo";
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { SonicWaveform } from "@/components/ui/sonic-waveform";
import { heroContent } from "@/data/site";
import { useGsapContext } from "@/lib/motion/gsap";

/**
 * Hero: copy in the left column, the AJ6 clip in the right, the waveform
 * ribbon running behind both.
 *
 * This is the approved split layout. The copy is set against the darkest part
 * of the veil rather than floating in the middle of the ribbon, which is what
 * lets the product hold the right half at full contrast — a centred headline
 * has to darken the whole frame to stay readable, and that costs the product
 * the light it is lit with.
 *
 * The trade line sits on the bottom rule, where it reads as a footer to the
 * frame rather than a fourth thing competing for the middle.
 */
export function Hero() {
  // The reveal is a CSS animation (`.p1-hero-line`), so the headline does not
  // wait on hydration to become visible — only the stagger is set here.
  const line = (index: number) => ({
    animationDelay: `${index * 90}ms`,
  });

  /*
    Depth on exit. Scrubbed against the first screen of scroll, with the three
    planes leaving at different rates: copy fastest, product behind it, ribbon
    slowest. Different speeds are what separate them; without it the hero is a
    flat card that slides off.

    Scrubbed rather than triggered, so it is reversible and tracks the scroll
    position exactly — nothing plays at you, it only responds. `end` is one
    viewport, so it is finished by the time the trust bar arrives.

    `scrub: true`, not a number. A numeric scrub eases toward the scroll
    position over that many seconds, which puts the hero on a different clock
    from the page it is pinned to and reads as it sliding around loosely
    behind the content. Scrolling here is native and unsmoothed, so this
    tracks it exactly.
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
        scope.querySelector("[data-hero-product]"),
        { y: -52, ease: "none" },
        0,
      )
      .to(
        scope.querySelector("[data-hero-stage]"),
        { y: -26, ease: "none" },
        0,
      );
  });

  // Rendered with the separators in signal orange, so the line reads as three
  // facts rather than one string.
  const trade = heroContent.meta.split("·").map((part) => part.trim());

  return (
    <section
      ref={sceneRef}
      aria-label="PRO1ST — professional audio equipment"
      className="relative flex min-h-svh flex-col justify-center overflow-hidden gutter-x pb-[104px] pt-[136px] lg:h-svh lg:pb-[92px]"
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
      {/*
        The ribbon is faded out before the product column.

        Mid-explode the AJ6's chassis opens, and its interior is pure black
        and connected to the frame edge, so the matte cuts through it — see
        `HeroProductVideo`. Nothing recovers those pixels, so the rule is that
        nothing bright may sit behind the product: against the page ground the
        gap reads as a shadowed interior, against a lit ribbon it reads as a
        hole. That also matches the approved layout, where the sweep builds
        under the headline and runs out at the mixer's leading edge.
      */}
      <div
        data-hero-stage=""
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          filter: "blur(5px)",
          maskImage:
            "linear-gradient(to right, #000 0%, #000 38%, transparent 66%)",
          WebkitMaskImage:
            "linear-gradient(to right, #000 0%, #000 38%, transparent 66%)",
        }}
      >
        <SonicWaveform />
      </div>

      {/*
        The veil, now weighted to the copy side. The linear pass guarantees the
        headline and lead sit on a dark ground whatever the ribbon is doing
        underneath; the radial keeps the frame edges from going flat. Both are
        masked out before the right column so the product keeps its contrast.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(96deg, color-mix(in srgb, var(--surface-base) 90%, transparent) 0%, color-mix(in srgb, var(--surface-base) 66%, transparent) 32%, transparent 64%), radial-gradient(ellipse 84% 66% at 34% 50%, color-mix(in srgb, var(--surface-base) 58%, transparent) 0%, transparent 72%)",
        }}
      />

      <div className="p1-shell relative z-[2] grid w-full items-center gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.04fr)] xl:gap-x-16">
        <div data-hero-copy="" className="flex flex-col items-start">
          {/*
            Each line is clipped so its reveal slides out of a hard edge. The
            clip box is the line box, which at line-height 0.88 is far shorter
            than Space Grotesk's ascender-to-descender extent — so it is padded
            out on both sides and pulled back by an equal negative margin,
            which buys the room without moving anything. Without it the display
            face is sheared off above the baseline.

            Three explicit lines rather than letting "Rhythm Operators" wrap:
            a wrap inside the clip box would put two lines behind one mask and
            reveal them as a block.
          */}
          <h1 className="p1-h1 p1-h1--split">
            <span className="block overflow-hidden py-[0.24em] -my-[0.24em]">
              <span
                data-p1-hero-word=""
                className="p1-hero-line"
                style={line(0)}
              >
                {heroContent.headlineTop}
              </span>
            </span>
            <span className="block overflow-hidden py-[0.24em] -my-[0.24em]">
              <span
                data-p1-hero-word=""
                className="p1-hero-line text-signal"
                style={line(1)}
              >
                {heroContent.headlineAccent}
              </span>
            </span>
            <span className="block overflow-hidden py-[0.24em] -my-[0.24em]">
              <span
                data-p1-hero-word=""
                className="p1-hero-line"
                style={line(2)}
              >
                {heroContent.headlineRest}
              </span>
            </span>
          </h1>

          <p className="p1-lead mt-8 max-w-[46ch]">{heroContent.lead}</p>

          {/*
            Stacked and equal-width below `sm`. Side by side the two labels
            need ~470px and the narrowest phone gives 342, so they wrap — and
            wrapped at their intrinsic widths they land ragged, one noticeably
            shorter than the other, which reads as a mistake rather than a
            pair. Full-width is the only honest stacked form.
          */}
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Magnetic>
              <ButtonLink
                href="/products"
                variant="primary"
                className="w-full justify-center sm:w-auto sm:justify-start"
              >
                Browse audio systems
              </ButtonLink>
            </Magnetic>
            <Magnetic>
              <ButtonLink
                href="/contact?enquiry=dealer"
                variant="outline"
                className="w-full justify-center sm:w-auto sm:justify-start"
              >
                Apply for dealer pricing
              </ButtonLink>
            </Magnetic>
          </div>
        </div>

        {/*
          The product bleeds past the shell into the right gutter on wide
          screens, which is what keeps it from reading as a card sitting in a
          column. It stays inside the shell below `xl`, where there is no
          gutter to spare.
        */}
        <div
          data-hero-product=""
          className="-mx-[var(--gutter)] sm:mx-0 xl:-mr-[calc(var(--gutter)-24px)]"
        >
          <HeroProductVideo />
        </div>
      </div>

      <div className="p1-shell absolute inset-x-0 bottom-0 z-[2] mx-auto hidden md:block">
        <div className="mx-[var(--gutter)] border-t border-hairline py-6">
          <div className="p1-mono flex flex-wrap items-center gap-x-4 text-soft">
            {trade.map((part, index) => (
              <span key={part} className="flex items-center gap-x-4">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-signal">
                    ·
                  </span>
                ) : null}
                {part}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
