"use client";

import { useEffect, useRef } from "react";

/**
 * Live spectrum across the bottom of the hero.
 *
 * Bars compress with scroll velocity and bloom orange near the pointer —
 * a level meter that reacts to you rather than a decorative loop.
 * Draws a single static frame under reduced motion, and pauses off-screen.
 */
export function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const pointer = { x: -999 };
    let velocity = 0;
    let lastY = window.scrollY;
    let visible = true;

    const draw = (time: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, w, h);

      const base = h * 0.62;
      const compress = 1 / (1 + Math.abs(velocity) * 0.012);
      const bars = Math.floor(w / 6);

      for (let i = 0; i < bars; i++) {
        const x = i * 6 + 1;
        const n =
          Math.sin(i * 0.09 + time * 0.0011) * 0.5 +
          Math.sin(i * 0.031 - time * 0.0007) * 0.32 +
          Math.sin(i * 0.21 + time * 0.0019) * 0.18;
        let a = Math.abs(n);
        if (pointer.x > -500) {
          const d = Math.abs(x - pointer.x);
          a *= 1 + Math.max(0, 1 - d / 260) * 1.1;
        }
        a *= compress;
        const barHeight = a * h * 0.42;
        ctx.fillStyle =
          a > 0.72 ? "rgba(255,106,0,0.9)" : "rgba(230,230,230,0.22)";
        ctx.fillRect(x, base - barHeight, 3, barHeight * 2);
      }

      ctx.fillStyle = "rgba(255,106,0,0.5)";
      ctx.fillRect(0, base, w, 1);
    };

    if (reduced) {
      draw(0);
      return;
    }

    const onMove = (event: MouseEvent) => {
      pointer.x = event.clientX;
    };
    const onScroll = () => {
      velocity += window.scrollY - lastY;
      lastY = window.scrollY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    let frame = requestAnimationFrame(function loop(time: number) {
      frame = requestAnimationFrame(loop);
      if (visible) draw(time);
      velocity *= 0.86;
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] block h-[34vh] w-full"
    />
  );
}
