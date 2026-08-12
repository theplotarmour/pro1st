"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CoverflowCarousel,
  type CoverflowSlide,
} from "@/components/ui/coverflow-carousel";
import type { ChainNode } from "@/lib/content/sections";
import { imagePalette, paletteWash } from "@/lib/motion/imagePalette";

/**
 * "The chain" — source to subwoofer as one system.
 *
 * The line as a coverflow rack of product cards. The rack is driven by the
 * reader — drag, arrow keys, the arrows or the dots — and by nothing else.
 *
 * The surround follows whatever is in front. The centred product's artwork is
 * sampled on a 3×3 grid and each cell is laid back down in the position it
 * was measured, so a photo that is blue top-left and green top-right washes
 * the section blue on the left, bleeding into green on the right. Nothing is
 * keyed to a product or a palette — it is measured off whatever image Shopify
 * returns.
 *
 * `nodes` carries only the editorial role for each link in the chain; name,
 * price and image are resolved from Shopify at request time.
 */
/** Fades the wash out at every edge so it never meets the black on a line. */
const EDGE_FEATHER = [
  "linear-gradient(to bottom, transparent 0%, #000 26%, #000 74%, transparent 100%)",
  "linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%)",
].join(", ");

export function ChainSection({ nodes }: { nodes: ChainNode[] }) {
  const washRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const frontRef = useRef(0);
  const [active, setActive] = useState(0);

  // A product without an image cannot be a card.
  const visible = useMemo(() => nodes.filter((node) => node.image), [nodes]);

  const slides = useMemo<CoverflowSlide[]>(
    () =>
      visible.map((node) => ({
        src: node.image!.src,
        alt: node.image!.alt || node.product,
        title: node.product,
        subtitle: node.label,
        price: node.price,
        href: `/products/${node.handle}`,
      })),
    [visible],
  );

  /*
    Two stacked layers, crossfaded. A single layer cannot animate between two
    multi-stop gradients — CSS has nothing to interpolate, so the wash would
    snap from one product's colours to the next. Painting the incoming map on
    the hidden layer and swapping opacity gives a real dissolve.
  */
  useEffect(() => {
    const slide = slides[active];
    if (!slide) return;

    let cancelled = false;
    void imagePalette(slide.src, 3).then((cells) => {
      if (cancelled || !cells) return;

      const incoming = frontRef.current === 0 ? 1 : 0;
      const next = washRefs[incoming]?.current;
      const current = washRefs[frontRef.current]?.current;
      if (!next || !current) return;

      next.style.backgroundImage = paletteWash(cells);
      next.style.opacity = "1";
      current.style.opacity = "0";
      frontRef.current = incoming;
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, slides]);

  if (slides.length === 0) return null;

  return (
    <section
      id="chain"
      aria-labelledby="chain-heading"
      // No top rule. Every other section is divided by a hairline, but this
      // one bleeds a colour wash across its own boundary — a 1px line drawn
      // over that reads as a seam the wash is failing to cross.
      className="relative overflow-hidden py-20 gutter-x lg:py-28"
    >
      {/*
        Masked to nothing at all four edges. Without it the wash stops dead on
        the section boundary and the colour reads as a lit rectangle sitting
        on the page rather than as light coming off the product — the sections
        above and below are flat black, so any hard edge is obvious.
      */}
      {washRefs.map((ref, index) => (
        <div
          key={index}
          ref={ref}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-[900ms] ease-signal"
          style={{
            maskImage: EDGE_FEATHER,
            WebkitMaskImage: EDGE_FEATHER,
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />
      ))}

      <div className="p1-shell relative z-[1]">
        <div className="flex flex-wrap items-baseline justify-between gap-8">
          <div>
            <div className="p1-eyebrow mb-6">[ 03 — The chain ]</div>
            <h2 id="chain-heading" className="p1-h2">
              Source to subwoofer. One system.
            </h2>
          </div>
          <p className="m-0 max-w-[34ch] text-base leading-[1.6] text-muted">
            {slides.length} pillars of the PRO1st line, engineered to
            interlock. Drag the rack, or use the arrow keys.
          </p>
        </div>

        <div className="mt-12">
          <CoverflowCarousel
            slides={slides}
            label="PRO1ST signal chain"
            cardWidth="clamp(190px, 24vw, 300px)"
            captionHeight="6.25rem"
            // Wider than the component's default, because the centre card is
            // scaled up — at the default pitch it swallowed both neighbours.
            gap={0.2}
            onSelect={setActive}
            showNavigation
            showPagination
          />
        </div>
      </div>
    </section>
  );
}
