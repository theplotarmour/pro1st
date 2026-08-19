"use client";

import Link from "next/link";
import * as React from "react";
import { Media } from "./Media";

/**
 * Coverflow carousel.
 *
 * The supplied component, kept intact in its mechanism: one fractional index
 * as the source of truth, transforms painted straight to the DOM rather than
 * through React state, distances folded into the shorter way round the ring
 * so looping needs no cloned nodes, and an exponential settle rather than a
 * spring.
 *
 * Four adaptations:
 *
 *   1. No lucide-react. The dependency exists in the original for two chevron
 *      glyphs; this codebase already draws its own icons as inline SVG, and a
 *      whole icon package for two arrows is not a trade worth making.
 *
 *   2. No `cn` from `@/lib/utils` — there is no such module here. Classes are
 *      joined locally, the same way `sonic-waveform` does it.
 *
 *   3. Project tokens instead of shadcn's. `bg-muted` → `bg-panel`,
 *      `text-foreground` → `text-strong`, `ring-ring` → the signal colour,
 *      and the `shadow-xl` under each card becomes a hairline border plus a
 *      restrained shadow, because a heavy drop shadow on a dark surface reads
 *      as a smear rather than depth.
 *
 *   4. `next/image` via `Media` instead of a raw `<img>`. These are Shopify
 *      CDN photographs at card size; serving them unoptimised at full
 *      resolution would cost more than the rest of the page combined. `Media`
 *      also carries the designed failure state for a dead remote asset.
 *
 * `onSelect` is added so the page can render its own caption — the built-in
 * one cannot hold a link, and every card here points at a product.
 */

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Pixels of travel before a press is treated as a drag rather than a click. */
const DRAG_THRESHOLD = 6;

export interface CoverflowSlide {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  /** Rendered under the title, in the signal colour. */
  price?: string;
  /** Makes the card's image a link. */
  href?: string;
  meta?: { label: string; value: string }[];
}

export interface CoverflowCarouselProps {
  slides: CoverflowSlide[];
  /** Degrees the first neighbour tilts. */
  rotate?: number;
  /** How far the first neighbour recedes, as a fraction of card width. */
  depth?: number;
  /** Viewer distance as a multiple of card width — smaller is a wider lens. */
  perspective?: number;
  /** Exponent on distance. Below 1 the rake eases off as cards travel out. */
  falloff?: number;
  /** Opacity lost per step from the centre. */
  fade?: number;
  /** Any CSS length. Everything else is derived from it, so the rake scales. */
  cardWidth?: string;
  /** Space between cards, as a fraction of card width. */
  gap?: number;
  loop?: boolean;
  showCaption?: boolean;
  showPagination?: boolean;
  showNavigation?: boolean;
  /** Fires whenever the centred card changes. */
  onSelect?: (index: number) => void;
  /** Height reserved under each image for the card's own text. */
  captionHeight?: string;
  /** How much larger the centred card sits than its neighbours. */
  centreScale?: number;
  /** Names the carousel for assistive tech. */
  label?: string;
  className?: string;
  cardClassName?: string;
}

export function CoverflowCarousel({
  slides,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = "clamp(148px, 22vw, 260px)",
  gap = 0.05,
  loop = true,
  showCaption = false,
  showPagination = false,
  showNavigation = false,
  onSelect,
  captionHeight = "5.5rem",
  centreScale = 1.18,
  label = "Cover carousel",
  className,
  cardClassName,
}: CoverflowCarouselProps) {
  const count = slides.length;

  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  /** Fractional card index at the centre. The single source of truth. */
  const posRef = React.useRef(0);
  /** Where the current settle is headed. Stepping off `pos` instead would
      swallow a keypress that lands mid-flight, before the round-off moves. */
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
    /** False until the pointer has moved far enough to count as a drag. */
    active: boolean;
  } | null>(null);

  const [selected, setSelected] = React.useState(0);

  const onSelectRef = React.useRef(onSelect);
  onSelectRef.current = onSelect;

  React.useEffect(() => {
    onSelectRef.current?.(selected);
  }, [selected]);

  /** Nearest whole card, folded back into 0..count-1. */
  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  // Paint straight to the DOM. Sixty state updates a second would re-render
  // every card for numbers React never needs to see.
  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      // Fold the distance into the shorter way round the ring. This is the
      // whole looping mechanism — no cloned nodes, no shuffling the DOM.
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      // Both the tilt and the recession ease off as cards travel out —
      // doubling the distance adds only about half again as much of each.
      // A linear ramp folds the second card shut; this keeps it readable.
      const ramp = Math.pow(distance, falloff);
      // Capped short of edge-on so a far card never turns its back.
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      // The centre card grows, and only the centre card — the boost is gone
      // by one step out. Scaled off the fractional distance rather than a
      // match on the selected index, so it grows and shrinks continuously
      // through a drag instead of popping when the round-off crosses.
      const scale = 1 + (centreScale - 1) * Math.max(0, 1 - distance);

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg) ` +
        `scale(${scale.toFixed(4)})`;

      // A card is teleported across the ring at exactly half a turn out, so it
      // has to be gone by then or the jump is visible.
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
    });
  }, [centreScale, count, depth, fade, falloff, gap, loop, rotate]);

  /*
    `will-change` is applied for the duration of a movement and taken off
    again afterwards.

    Left on permanently — as it was — it holds every card on its own
    compositor layer for the entire life of the page. That is eleven
    shadowed, 3D-rotated textures resident in GPU memory on a device that may
    not have much, to accelerate an animation that is not running. The hint
    is only worth anything while something is actually moving.
  */
  const setPromotion = React.useCallback((on: boolean) => {
    for (const card of cardRefs.current) {
      if (card) card.style.willChange = on ? "transform, opacity" : "";
    }
  }, []);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setPromotion(true);
      targetRef.current = target;
      setSelected(indexAt(target));

      // Reduced motion gets the destination, not the journey.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        posRef.current = target;
        paint();
        setPromotion(false);
        return;
      }

      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          setPromotion(false);
          return;
        }
        // Exponential ease-out, not a spring. Swap in a spring only if the
        // settle needs overshoot.
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint, setPromotion],
  );

  const clamp = React.useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  );

  const goTo = React.useCallback(
    (index: number) => {
      // Take the shorter way round rather than unwinding the whole ring.
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle],
  );

  const nudge = React.useCallback(
    (by: number) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle],
  );

  /*
    Dragging is tracked on `window`, and `setPointerCapture` is never used.

    Capture is the obvious tool here and it is the wrong one: it retargets
    every later pointer event to the frame, and the browser then dispatches
    `click` to the frame instead of to whatever was under the finger. That
    silently swallowed every product link on every card — the anchors were
    correct and reachable, and nothing happened when you clicked them.
    Raising the movement threshold does not help, because the capture has
    already been claimed by the time the threshold is crossed.

    Window listeners keep the event targets honest, so a click lands on the
    anchor. A real drag then suppresses that click explicitly, on the way out.
  */
  const suppressClickRef = React.useRef(false);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
      active: false,
    };

    const onMove = (move: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== move.pointerId) return;

      const travelled = move.clientX - drag.x;
      if (!drag.active) {
        if (Math.abs(travelled) < DRAG_THRESHOLD) return;
        drag.active = true;
        setPromotion(true);
      }

      const pitch = widthRef.current * (1 + gap);
      if (!pitch) return;

      const now = performance.now();
      const previous = posRef.current;
      posRef.current = clamp(drag.pos - travelled / pitch);
      // Cards per second, for the throw.
      drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
      drag.t = now;

      const index = indexAt(posRef.current);
      if (index !== selected) setSelected(index);
      paint();
    };

    const onUp = (up: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);

      const drag = dragRef.current;
      if (!drag || drag.id !== up.pointerId) return;
      dragRef.current = null;
      // A press that never travelled is a click. Leave it alone.
      if (!drag.active) return;

      // Swallow the click this drag is about to produce, so releasing over a
      // card does not also open it.
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);

      // Let a flick carry, but never more than two cards.
      const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
      settle(clamp(Math.round(posRef.current + carried)));
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  // Card width drives pitch, depth and perspective, so it is the only thing
  // worth measuring — and only when the box actually changes.
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const active = slides[selected];

  return (
    <div
      className={cn("w-full", className)}
      style={
        {
          "--cf-card": cardWidth,
          "--cf-caption": captionHeight,
        } as React.CSSProperties
      }
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="relative">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(1);
            }
          }}
          // Vertical padding keeps the enlarged centre card and its shadow
          // clear of the overflow clip.
          className="cursor-grab overflow-hidden py-14 outline-none focus-visible:ring-2 focus-visible:ring-signal active:cursor-grabbing"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            // Horizontal drag is ours; the page keeps vertical scrolling.
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative select-none"
            style={{
              height: `calc(var(--cf-card) + var(--cf-caption))`,
              transformStyle: "preserve-3d",
            }}
          >
            {slides.map((slide, index) => {
              const isCentre = index === selected;
              return (
                <div
                  key={slide.src}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${count}`}
                  className={cn(
                    "absolute left-1/2 top-0 flex flex-col overflow-hidden border border-hairline bg-panel",
                    cardClassName,
                  )}
                  style={{
                    width: "var(--cf-card)",
                    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
                  }}
                >
                  {/*
                    Only the centred card's link is reachable. A raked card is
                    a sliver of a target and its label is unreadable, so
                    tabbing through eleven of them is noise — arrow keys and
                    the dots are how you reach the others.
                  */}
                  <CardImage
                    slide={slide}
                    interactive={isCentre}
                    suppressClick={suppressClickRef}
                    onNavigateAway={() => {
                      if (!isCentre) goTo(index);
                    }}
                  />

                  {(slide.title || slide.price) && (
                    <div
                      className="flex flex-none flex-col justify-center gap-1.5 border-t border-hairline px-4"
                      style={{ height: "var(--cf-caption)" }}
                    >
                      {slide.subtitle && (
                        <span className="p1-mono text-[10px] text-signal">
                          {slide.subtitle}
                        </span>
                      )}
                      {slide.title && (
                        <span className="line-clamp-2 font-display text-[13px] font-medium leading-[1.3] text-strong">
                          {slide.title}
                        </span>
                      )}
                      {slide.price && (
                        <span className="font-display text-[13px] font-medium text-signal">
                          {slide.price}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showNavigation && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => nudge(-1)}
              className="p1-tap absolute left-3 top-1/2 z-[200] grid size-9 -translate-y-1/2 cursor-pointer place-items-center border border-hairline bg-ink/70 text-ash backdrop-blur transition-colors hover:text-signal"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => nudge(1)}
              className="p1-tap absolute right-3 top-1/2 z-[200] grid size-9 -translate-y-1/2 cursor-pointer place-items-center border border-hairline bg-ink/70 text-ash backdrop-blur transition-colors hover:text-signal"
            >
              <Chevron direction="right" />
            </button>
          </>
        )}
      </div>

      {showCaption && active?.title && (
        <div className="mt-2 flex flex-col items-center px-6 text-center">
          <p className="font-display text-[15px] font-medium tracking-tight text-strong">
            {active.title}
          </p>
          {active.subtitle && (
            <p className="p1-mono mt-1 text-soft">{active.subtitle}</p>
          )}
          {active.meta && active.meta.length > 0 && (
            <dl className="mt-8 w-full max-w-[230px] text-[12px]">
              {active.meta.map((row) => (
                <div key={row.label} className="flex justify-between py-[5px]">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="font-medium text-strong">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {showPagination && (
        <div className="mt-6 flex items-center justify-center">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selected}
              onClick={() => goTo(index)}
              className="grid cursor-pointer place-items-center border-0 bg-transparent p-2"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  index === selected
                    ? "bg-signal"
                    : "bg-[var(--hairline-strong)]",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CardImage({
  slide,
  interactive,
  suppressClick,
  onNavigateAway,
}: {
  slide: CoverflowSlide;
  interactive: boolean;
  suppressClick: React.RefObject<boolean>;
  onNavigateAway: () => void;
}) {
  const image = (
    <Media
      src={slide.src}
      alt={slide.alt}
      sizes="(max-width: 760px) 60vw, 320px"
    />
  );

  if (!slide.href) {
    return <div className="relative aspect-square flex-none">{image}</div>;
  }

  return (
    <Link
      href={slide.href}
      tabIndex={interactive ? 0 : -1}
      aria-hidden={!interactive}
      // A click on an off-centre card brings it to the front instead of
      // navigating — the same gesture people already expect from a coverflow.
      onClick={(event) => {
        // The click a drag leaves behind must not also open the product.
        if (suppressClick.current) {
          event.preventDefault();
          return;
        }
        if (!interactive) {
          event.preventDefault();
          onNavigateAway();
        }
      }}
      // The frame owns horizontal dragging; without this a drag that starts
      // on the artwork is treated as an image drag by the browser.
      draggable={false}
      className="relative aspect-square flex-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--signal)]"
    >
      {image}
    </Link>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}
