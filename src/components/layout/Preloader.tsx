"use client";

import { useEffect, useRef, useState } from "react";

/**
 * VU-meter preload curtain. Shown once per session.
 *
 * Kept short on purpose: the previous 1.6s curtain plus a 0.5s fade plus the
 * 0.9s headline reveal meant roughly three seconds before a first-time visitor
 * could read the brand name. A curtain should punctuate the entrance, not
 * delay it.
 */
export function Preloader() {
  const [active, setActive] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let seen = true;
    try {
      seen = window.sessionStorage.getItem("p1-seen") === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = reduced ? 200 : 700;
    const start = performance.now();
    const bars = Array.from(
      barsRef.current?.children ?? [],
    ) as HTMLElement[];

    document.body.style.overflow = "hidden";

    let frame = 0;
    let finishTimer = 0;

    const step = () => {
      const e = Math.min(1, (performance.now() - start) / duration);
      if (percentRef.current) {
        percentRef.current.textContent = `${String(Math.round(e * 100)).padStart(3, "0")}%`;
      }
      bars.forEach((bar, i) => {
        const level =
          e < 0.88
            ? 0.15 +
              Math.abs(Math.sin(performance.now() / (150 + i * 40) + i)) *
                (0.25 + e * 0.6)
            : 1;
        bar.style.transform = `scaleY(${Math.min(1, level)})`;
      });

      if (e < 1) {
        frame = requestAnimationFrame(step);
        return;
      }

      bars.forEach((bar) => {
        bar.style.transition = "transform 420ms var(--e-signal)";
        bar.style.transform = "scaleY(0.02)";
      });
      if (shellRef.current) shellRef.current.style.opacity = "0";

      finishTimer = window.setTimeout(() => {
        try {
          window.sessionStorage.setItem("p1-seen", "1");
        } catch {
          /* ignore */
        }
        document.body.style.overflow = "";
        setActive(false);
        // The hero holds its headline until the curtain lifts.
        window.dispatchEvent(new Event("p1:ready"));
      }, 260);
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(finishTimer);
      document.body.style.overflow = "";
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={shellRef}
      aria-hidden="true"
      className="fixed inset-0 z-[200] grid place-items-center bg-ink transition-opacity duration-500 ease-cut"
    >
      <div className="flex flex-col items-center gap-7">
        <div ref={barsRef} className="flex h-[120px] items-end gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 origin-bottom bg-signal"
              style={{ height: "12%" }}
            />
          ))}
        </div>
        <div
          ref={percentRef}
          className="font-mono text-[11px] tracking-[0.08em] text-muted"
        >
          000%
        </div>
      </div>
    </div>
  );
}
