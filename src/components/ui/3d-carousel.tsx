"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { useMediaQuery, useReducedMotion } from "@/lib/motion";
import { Media } from "./Media";

/**
 * Drag-rotated ring of cards in 3D, adapted from the public shadcn
 * "3d-carousel" gallery template. Three changes from that template:
 *
 *   1. No click-to-zoom lightbox. Every card here is a link to a real page
 *      (a filtered product listing), so a click navigates directly.
 *
 *   2. Only the frontmost face is a real, navigable link; every other face
 *      is a plain button that brings it to front. The template's every-face
 *      is a live link — harmless there (any of its Picsum photos opening the
 *      same generic lightbox), but wrong here: with this many faces on the
 *      ring most of them are steep, sliver-thin from this angle, and their
 *      hit regions overlap the neighbour in front of them. A tester clicking
 *      what visibly reads as one brand's logo landed on the *next* brand's
 *      page — `coverflow-carousel.tsx` hit this exact class of bug for the
 *      signal-chain carousel and fixed it the same way (see its own
 *      comment): only the centred card is reachable, everything else just
 *      recentres on click.
 *
 *   3. The ring now snaps to the nearest face on release instead of coasting
 *      to an arbitrary angle — needed to make "frontmost face" a stable,
 *      well-defined thing rather than a moving target.
 *
 * `useMediaQuery`/`useReducedMotion` come from `@/lib/motion` rather than
 * being redefined — this codebase already has both.
 */

export interface Carousel3DSlide {
  src: string;
  alt: string;
  title: string;
  href: string;
}

const springOut = {
  type: "spring" as const,
  stiffness: 100,
  damping: 30,
  mass: 0.1,
};

export function Carousel3D({
  slides,
  label = "Carousel",
}: {
  slides: Carousel3DSlide[];
  label?: string;
}) {
  const isScreenSizeSm = useMediaQuery("(max-width: 640px)");
  const reducedMotion = useReducedMotion();
  const controls = useAnimation();
  const rotation = useMotionValue(0);
  const transform = useTransform(
    rotation,
    (value) => `rotate3d(0, 1, 0, ${value}deg)`,
  );

  const cylinderWidth = isScreenSizeSm ? 1100 : 1800;
  const faceCount = slides.length;
  const faceWidth = cylinderWidth / faceCount;
  const radius = cylinderWidth / (2 * Math.PI);
  const step = 360 / faceCount;

  const angles = useMemo(
    () => slides.map((_, i) => i * step),
    [slides, step],
  );

  // Where the ring is headed. A drag mid-flight steps off this rather than
  // off `rotation` itself, so a second gesture starting before the settle
  // finishes still reads the intended destination, not whatever frame the
  // spring happened to be on.
  const targetRef = useRef(0);
  const [selected, setSelected] = useState(0);

  const indexAt = (deg: number) =>
    (((Math.round(-deg / step) % faceCount) + faceCount) % faceCount);

  const goTo = (index: number) => {
    // Shortest way round the ring rather than unwinding past 0.
    const current = targetRef.current;
    const raw = -index * step;
    const delta = (((raw - current + 180) % 360) + 360) % 360 - 180;
    const target = current + delta;
    targetRef.current = target;
    setSelected(index);
    controls.start({
      rotateY: target,
      transition: reducedMotion ? { duration: 0 } : springOut,
    });
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="flex h-full items-center justify-center"
      style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
    >
      <motion.div
        drag="x"
        className="relative flex h-full origin-center cursor-grab justify-center outline-none active:cursor-grabbing"
        style={{
          transform,
          rotateY: rotation,
          width: cylinderWidth,
          transformStyle: "preserve-3d",
        }}
        onDrag={(_, info) => {
          const next = rotation.get() + info.offset.x * 0.05;
          rotation.set(next);
          const index = indexAt(next);
          if (index !== selected) setSelected(index);
        }}
        onDragEnd={(_, info) => {
          // Snap to the nearest face rather than wherever momentum stops —
          // "frontmost" only means something if a face actually lands there.
          const projected = rotation.get() + info.velocity.x * 0.05;
          const index = indexAt(projected);
          const target = -index * step;
          // Land via the shortest arc from wherever the drag actually ended.
          const delta =
            (((target - projected + 180) % 360) + 360) % 360 - 180;
          targetRef.current = projected + delta;
          setSelected(index);
          controls.start({
            rotateY: targetRef.current,
            transition: reducedMotion ? { duration: 0 } : springOut,
          });
        }}
        animate={controls}
      >
        {slides.map((slide, i) => {
          const isFront = i === selected;
          // Circular distance from the frontmost face. Anything past an
          // immediate neighbour is steep enough that its on-screen sliver
          // overlaps the face in front of it — that overlap is what made a
          // click on a distant face's edge land on its neighbour instead
          // (found live: "Show P. AUDIO" recentred PRO-MAX). Cutting those
          // faces out of hit-testing entirely, rather than just narrowing
          // their target, is what actually removes the ambiguity — the
          // browser only has unoccluded candidates left to resolve a click
          // against.
          const distance = Math.min(
            (i - selected + faceCount) % faceCount,
            (selected - i + faceCount) % faceCount,
          );
          const isReachable = distance <= 1;

          return (
            <motion.div
              key={slide.href}
              className="absolute flex h-full origin-center items-center justify-center border border-hairline bg-white p-3"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${angles[i]}deg) translateZ(${radius}px)`,
                pointerEvents: isReachable ? undefined : "none",
              }}
            >
              {isFront ? (
                <Link
                  href={slide.href}
                  draggable={false}
                  aria-label={slide.title}
                  className="relative block aspect-square w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)]"
                >
                  <Media
                    src={slide.src}
                    alt={slide.alt}
                    fit="contain"
                    sizes={`${Math.round(faceWidth)}px`}
                  />
                </Link>
              ) : isReachable ? (
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show ${slide.title}`}
                  className="relative block aspect-square w-full cursor-pointer border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)]"
                >
                  <Media src={slide.src} alt="" fit="contain" />
                </button>
              ) : (
                <div aria-hidden="true" className="relative block aspect-square w-full">
                  <Media src={slide.src} alt="" fit="contain" />
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
