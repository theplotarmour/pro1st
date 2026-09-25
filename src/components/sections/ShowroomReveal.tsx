"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Media } from "@/components/ui/Media";
import { useGsapContext } from "@/lib/motion/gsap";

/**
 * The showroom pull-back — scroll scrubs a camera move backward through the
 * PRO1ST showroom, frame by frame, tied exactly to scroll position.
 *
 * Why a frame sequence on canvas, not a `<video>` scrubbed via
 * `currentTime`: `src/components/hero/HeroProductVideo.tsx` already
 * discovered and documented the reason. `currentTime` seeking stutters
 * against the codec's keyframes, and negative `playbackRate` doesn't exist —
 * that component works around it by only ever playing forward at rate 1.
 * A scroll-tied scrub has no such option: it must seek both directions,
 * unpredictably, exactly where the reader's wheel puts it. A frame sequence
 * has no seek cost at all; picking frame N is an array index, not a decode.
 *
 * Frames: public/img/origin-reveal/frame-001.webp … frame-091.webp, 1280×720,
 * 13fps sampling of a 7s clip (91 frames, ~4.9MB total) — scroll position is
 * what reads as the "frame rate" here, not the source clip's native 24fps.
 */

const FRAME_COUNT = 91;
const FRAME_PATH = (n: number) =>
  `/img/origin-reveal/frame-${String(n).padStart(3, "0")}.webp`;
const LAST_FRAME = FRAME_PATH(FRAME_COUNT);

export function ShowroomReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const [framesReady, setFramesReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  // Preload the sequence once the section is close to view — this is the
  // one section on the page genuinely worth ~5MB, but only for a reader who
  // actually scrolls there.
  useEffect(() => {
    if (reducedMotion) return;
    const el = sectionRef.current;
    if (!el || framesRef.current.length > 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        let loaded = 0;
        const images: HTMLImageElement[] = [];
        for (let i = 1; i <= FRAME_COUNT; i++) {
          const img = new Image();
          img.src = FRAME_PATH(i);
          img.onload = img.onerror = () => {
            loaded++;
            if (loaded === FRAME_COUNT) setFramesReady(true);
          };
          images[i - 1] = img;
        }
        framesRef.current = images;
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const gsapRef = useGsapContext<HTMLDivElement>(
    (gsap, scope) => {
      const canvas = canvasRef.current;
      if (!canvas || !framesReady) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let currentIndex = 0;
      const draw = (index: number) => {
        currentIndex = index;
        const img = framesRef.current[index];
        const rect = canvas.getBoundingClientRect();
        if (!img || rect.width === 0) return;
        if (canvas.width !== rect.width * dpr) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
        }
        // Sharpness matters here — a real photographic frame, not a cheap
        // vector redraw — unlike sonic-waveform.tsx's deliberate 1× canvas.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };

      draw(0);

      // A resize can change the canvas's rendered width without any scroll
      // happening — without this the backing store stays stale until the
      // next scroll tick redraws it at the old size.
      const onResize = () => draw(currentIndex);
      window.addEventListener("resize", onResize);

      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.create({
          trigger: scope,
          start: "top top",
          end: "+=180%",
          pin: true,
          scrub: 0.4,
          onUpdate: (self) => {
            const index = Math.min(
              FRAME_COUNT - 1,
              Math.floor(self.progress * FRAME_COUNT),
            );
            draw(index);
          },
        });
      });

      return () => {
        window.removeEventListener("resize", onResize);
      };
    },
    [framesReady],
  );

  if (reducedMotion) {
    return (
      <Container as="section" className="py-24 lg:py-32">
        <div className="relative aspect-video overflow-hidden border border-hairline bg-panel">
          <Media
            src={LAST_FRAME}
            alt="Inside the PRO1ST showroom, Chandni Chowk — the full floor."
          />
        </div>
      </Container>
    );
  }

  return (
    <div ref={sectionRef} className="relative">
      <section
        ref={gsapRef}
        aria-label="Inside the PRO1ST showroom"
        className="relative flex h-screen items-center justify-center overflow-hidden bg-ink"
      >
        <canvas
          ref={canvasRef}
          className="aspect-video w-full max-w-[1280px]"
          aria-hidden="true"
        />
        <p className="p1-mono absolute bottom-8 left-1/2 -translate-x-1/2 normal-case tracking-[0.04em] text-faint">
          {framesReady ? "Scroll to walk through" : "Loading…"}
        </p>
      </section>
    </div>
  );
}
