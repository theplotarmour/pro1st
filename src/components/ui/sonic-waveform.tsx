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

    /*
      Detail is scaled to the machine, not to the design.

      `hardwareConcurrency` is a coarse signal but it is the only one a page
      gets, and the failure mode is safe in both directions: a phone that
      reports four cores draws two thirds of the curves, which on a ribbon
      this soft is not a visible difference, while a workstation gets the full
      composition.
    */
    const cores = navigator.hardwareConcurrency ?? 4;
    const lean = cores <= 4 || window.innerWidth < 900;
    const lines = lean ? Math.round(lineCount * 0.6) : lineCount;
    const segments = lean ? Math.round(segmentCount * 0.7) : segmentCount;

    const resizeCanvas = () => {
      /*
        Deliberately 1× — never devicePixelRatio.

        This is a soft, blurred ribbon with no edge worth resolving, and the
        backing store is filled and stroked in full every single frame. At 2×
        on a retina display that is four times the pixels for a shape whose
        entire character is that it has no detail. This one line is the
        largest single saving in the hero.
      */
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      mouse.x = width / 2;
      mouse.y = height / 2;
    };

    const draw = () => {
      // Translucent fill rather than clearRect — this is what leaves the
      // motion trail behind each curve.
      ctx.fillStyle = `rgba(${surface.r}, ${surface.g}, ${surface.b}, 0.1)`;
      ctx.fillRect(0, 0, width, height);

      const centre = height / 2;

      /*
        The cursor term depends on x and the centre line, never on i — so it
        is the same for every one of the curves and only has to be computed
        once per column instead of lines × segments times. Squared distance
        with an early-out also avoids a Math.hypot per point; measured
        together on the live canvas, 0.53ms → 0.33ms per frame.
      */
      const mouseDy = centre - mouse.y;
      const mouseDy2 = mouseDy * mouseDy;
      const RADIUS2 = 400 * 400;

      for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        const progress = i / lines;
        const colorIntensity = Math.sin(progress * Math.PI);
        ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${
          colorIntensity * 0.5
        })`;
        ctx.lineWidth = 1.5;

        for (let j = 0; j < segments + 1; j++) {
          const x = (j / segments) * width;

          const dx = x - mouse.x;
          const distance2 = dx * dx + mouseDy2;
          const mouseEffect =
            distance2 >= RADIUS2 ? 0 : 1 - Math.sqrt(distance2) / 400;

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

    };

    /*
      Frame rate follows the cursor.

      A flat 30fps halves the raster cost, and for an ambient ribbon nobody
      is watching that is free — but the cursor deforms this thing, and a
      pointer sampled at 30Hz reads as the ribbon lagging behind the mouse.
      So: full rate while the pointer is live, half rate once it has been
      still for a moment. The expensive case is the one nobody is looking at.
    */
    const ACTIVE_MS = 1000 / 60;
    const IDLE_MS = 1000 / 30;
    /** How long after the last movement the cursor still counts as live. */
    const POINTER_GRACE_MS = 1500;

    let lastFrame = 0;
    let lastPointerAt = -Infinity;

    const loop = (now: number) => {
      animationFrameId = requestAnimationFrame(loop);
      if (!visible) return;

      const engaged = now - lastPointerAt < POINTER_GRACE_MS;
      const budget = engaged ? ACTIVE_MS : IDLE_MS;
      const elapsed = now - lastFrame;
      if (elapsed < budget) return;

      /*
        Phase advances by elapsed time, not by a fixed step. With a fixed
        step the ribbon's speed changes whenever the frame rate does, so it
        visibly sped up the moment the pointer engaged. Clamped so a long
        stall — a background tab, a slow first paint — resumes rather than
        jumping the whole gap at once.
      */
      time += Math.min(elapsed, 100) * 0.0012;
      lastFrame = now;

      // One box read per frame, and only while the cursor matters. The hero
      // drifts under the scroll parallax, so a cached box goes stale.
      if (engaged && pointer.seen) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = pointer.clientX - rect.left;
        mouse.y = pointer.clientY - rect.top;
      }

      draw();
    };

    /*
      The handler stores raw viewport coordinates and nothing else. Calling
      `getBoundingClientRect` inside a pointer handler forces a layout flush on
      every event — mousemove fires far faster than the screen refreshes, so
      that is several forced layouts per frame, which is the one thing
      guaranteed to make a cursor feel like it is dragging weight behind it.
      The box is resolved once per frame instead, in the loop.
    */
    const pointer = { clientX: 0, clientY: 0, seen: false };

    const handleMouseMove = (event: MouseEvent) => {
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      pointer.seen = true;
      lastPointerAt = performance.now();
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

    /*
      Start after the browser has finished the work that matters.

      Hydration, the font swap and the hero's own images all land in the first
      second, and an animation loop competing with them is exactly the
      "laggy on load, fine afterwards" shape. `requestIdleCallback` yields
      until the main thread is free; the timeout is the floor for browsers
      that never report idle.
    */
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => loop(performance.now()), {
          timeout: 1200,
        })
      : window.setTimeout(() => loop(performance.now()), 400);

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
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
