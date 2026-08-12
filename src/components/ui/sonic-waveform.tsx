"use client";

import { useEffect, useRef } from "react";

/**
 * Sonic waveform — the hero soundstage.
 *
 * Canvas 2D rather than Three.js: this costs nothing in bundle size where a
 * WebGL scene would have added roughly 600KB gzipped for a background.
 *
 * A field of phase-shifted sine curves flowing across the viewport, brightest
 * through the middle band, tinted toward the signal accent at their peaks.
 * The cursor bends the field locally — the surface reacts to you rather than
 * looping at you, which is the difference between a soundstage and a screen
 * saver.
 *
 * Deliberately different from a bar spectrum: continuous curves with additive
 * blending read as a field of energy; vertical bars read as a media-player
 * visualiser, which is what made the previous version look amateurish.
 */

interface SonicWaveformProps {
  /** Curves drawn per frame. Fewer on small screens. */
  lineCount?: number;
  className?: string;
}

interface Pointer {
  x: number;
  y: number;
  /** Eased toward x/y so the field never snaps. */
  ex: number;
  ey: number;
  active: boolean;
}

export function SonicWaveform({
  lineCount = 28,
  className = "",
}: SonicWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Read the brand accent from CSS rather than hardcoding it, so the
    // waveform can never drift from the design tokens.
    const styles = getComputedStyle(document.documentElement);
    const signal = styles.getPropertyValue("--signal").trim() || "#ff6a00";
    const rgb = hexToRgb(signal) ?? { r: 255, g: 106, b: 0 };

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let running = true;

    const pointer: Pointer = { x: 0, y: 0, ex: 0, ey: 0, active: false };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!pointer.active) {
        pointer.x = pointer.ex = width * 0.72;
        pointer.y = pointer.ey = height * 0.5;
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      // Ease the pointer so the field bends rather than jumps.
      pointer.ex += (pointer.x - pointer.ex) * 0.06;
      pointer.ey += (pointer.y - pointer.ey) * 0.06;

      const t = time * 0.00016;
      const midY = height * 0.5;
      const step = Math.max(6, Math.round(width / 220));

      for (let i = 0; i < lineCount; i++) {
        // -1 … 1 across the stack, 0 at the centre line.
        const n = lineCount > 1 ? (i / (lineCount - 1)) * 2 - 1 : 0;
        const baseY = midY + n * height * 0.36;

        // Centre lines are brightest and carry the accent.
        const centreness = 1 - Math.abs(n);
        const heat = Math.pow(centreness, 2.4);
        const alpha = 0.05 + heat * 0.42;
        const mix = Math.pow(centreness, 3);

        ctx.beginPath();
        ctx.lineWidth = 0.6 + heat * 1.1;
        ctx.strokeStyle = `rgba(${Math.round(190 + (rgb.r - 190) * mix)},${Math.round(
          195 + (rgb.g - 195) * mix,
        )},${Math.round(205 + (rgb.b - 205) * mix)},${alpha.toFixed(3)})`;

        for (let x = 0; x <= width + step; x += step) {
          const u = x / Math.max(1, width);

          // Three summed harmonics — enough to feel organic, cheap to run.
          let y =
            Math.sin(u * 7.5 + t * 2.1 + n * 1.9) * 26 +
            Math.sin(u * 3.1 - t * 1.4 + n * 3.3) * 18 +
            Math.sin(u * 15.7 + t * 3.2 + n * 0.7) * 7;

          // Envelope: energy concentrates through the middle of the stack.
          y *= 0.35 + centreness * 0.95;

          // Local displacement around the cursor, falling off with distance.
          const dx = x - pointer.ex;
          const dy = baseY - pointer.ey;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / (Math.max(width, height) * 0.32));
          y -= influence * influence * 46;

          const py = baseY + y;
          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }

        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (time: number) => {
      if (!running) return;
      frame = requestAnimationFrame(loop);
      if (visible) draw(time);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
    };

    resize();

    if (reduced) {
      // One static frame: the composition survives, the motion does not.
      draw(0);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [lineCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
      style={{
        // Dissolve the field into the page rather than ending on a hard edge.
        maskImage:
          "radial-gradient(ellipse 85% 75% at 62% 50%, #000 35%, transparent 78%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 85% 75% at 62% 50%, #000 35%, transparent 78%)",
      }}
    />
  );
}

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return {
    r: Number.parseInt(match[1]!, 16),
    g: Number.parseInt(match[2]!, 16),
    b: Number.parseInt(match[3]!, 16),
  };
}
