"use client";

import { useEffect, useRef } from "react";

/**
 * Signal cursor: hard dot at the pointer, lagged ring behind it.
 * Fine pointers only — never shown on touch, never under reduced motion.
 */
export function CursorRing() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer:fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!fine || reduced) return;

    const pos = { x: -999, y: -999, lx: -999, ly: -999 };
    const onMove = (event: MouseEvent) => {
      pos.x = event.clientX;
      pos.y = event.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let frame = requestAnimationFrame(function loop() {
      frame = requestAnimationFrame(loop);
      if (pos.x < -500) return;
      pos.lx += (pos.x - pos.lx) * 0.15;
      pos.ly += (pos.y - pos.ly) * 0.15;
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (dot) {
        dot.style.opacity = "1";
        dot.style.transform = `translate(${pos.x}px,${pos.y}px)`;
      }
      if (ring) {
        ring.style.opacity = "1";
        ring.style.transform = `translate(${pos.lx}px,${pos.ly}px)`;
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[190] -ml-4 -mt-4 hidden h-8 w-8 rounded-full border border-sig-40 opacity-0 lg:block"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[191] -ml-[3px] -mt-[3px] hidden h-1.5 w-1.5 rounded-full bg-signal opacity-0 lg:block"
      />
    </>
  );
}
