"use client";

import { useEffect, useRef } from "react";

/**
 * Sonic waveform — the hero soundstage.
 *
 * The supplied `SonicWaveformCanvas` algorithm, unchanged in structure: 60
 * overlapping curves sharing one centre line, each a sum of a slow noise term
 * and a beating spike term, with a translucent fill each frame producing the
 * motion-trail persistence that gives the ribbon its density. The cursor
 * amplifies the spike within a 400px radius.
 *
 * Two adaptations, both required:
 *
 *   1. Colour. The original strokes teal (0,255,192) on `bg-black`. PRO1ST is
 *      signal orange on #0d0d0f, so the stroke and the trail fill are read
 *      from the --signal and --surface-base custom properties at runtime.
 *      Hardcoding teal would have put a second accent colour on the brand.
 *
 *   2. Sizing. The original measures `window.innerWidth/Height`. This is a
 *      section background, not a full-page canvas, so it measures its own box
 *      and is DPR-correct — otherwise it draws off-register inside the hero.
 *
 * The demo hero that shipped alongside it is deliberately NOT used: it carries
 * its own copy ("Sonic Waveform", "Real-Time Data Sonification", "Analyze the
 * Stream") for a data-sonification product, and its framer-motion entrance and
 * lucide icons would have replaced PRO1ST's headline and CTAs. Only the canvas
 * was wanted, so neither dependency is installed.
 */

interface SonicWaveformProps {
  /** Overlapping curves per frame. */
  lineCount?: number;
  /** Horizontal resolution of each curve. */
  segmentCount?: number;
  className?: string;
}

export function SonicWaveform({
  lineCount = 60,
  segmentCount = 80,
  className = "",
}: SonicWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const accent =
      hexToRgb(styles.getPropertyValue("--signal").trim()) ??
      { r: 255, g: 106, b: 0 };
    const surface =
      hexToRgb(styles.getPropertyValue("--surface-base").trim()) ??
      { r: 13, g: 13, b: 15 };

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    let visible = true;
    let time = 0;

    const mouse = { x: 0, y: 0 };

    const resizeCanvas = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mouse.x = width / 2;
      mouse.y = height / 2;
    };

    const draw = () => {
      // Translucent fill rather than clearRect — this is what leaves the
      // motion trail behind each curve.
      ctx.fillStyle = `rgba(${surface.r}, ${surface.g}, ${surface.b}, 0.1)`;
      ctx.fillRect(0, 0, width, height);

      const centre = height / 2;

      for (let i = 0; i < lineCount; i++) {
        ctx.beginPath();
        const progress = i / lineCount;
        const colorIntensity = Math.sin(progress * Math.PI);
        ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${
          colorIntensity * 0.5
        })`;
        ctx.lineWidth = 1.5;

        for (let j = 0; j < segmentCount + 1; j++) {
          const x = (j / segmentCount) * width;

          const distToMouse = Math.hypot(x - mouse.x, centre - mouse.y);
          const mouseEffect = Math.max(0, 1 - distToMouse / 400);

          const noise = Math.sin(j * 0.1 + time + i * 0.2) * 20;
          const spike =
            Math.cos(j * 0.2 + time + i * 0.1) *
            Math.sin(j * 0.05 + time) *
            50;
          const y = centre + noise + spike * (1 + mouseEffect * 2);

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      time += 0.02;
    };

    const loop = () => {
      animationFrameId = requestAnimationFrame(loop);
      if (visible) draw();
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    const handleVisibility = () => {
      visible = document.visibilityState === "visible";
    };

    resizeCanvas();

    if (reduced) {
      // The trail needs successive frames to build, so a single pass would
      // render almost nothing. A short fixed run settles the composition,
      // then it stops.
      for (let i = 0; i < 60; i++) draw();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [lineCount, segmentCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 h-full w-full",
        className,
      )}
      style={{
        // Dissolves the ribbon into the page instead of ending on a hard edge.
        maskImage:
          "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent), radial-gradient(ellipse 90% 70% at 50% 50%, #000 40%, transparent 85%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent), radial-gradient(ellipse 90% 70% at 50% 50%, #000 40%, transparent 85%)",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
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
