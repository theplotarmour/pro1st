"use client";

import { useEffect, useRef } from "react";

interface CounterProps {
  to: number;
  suffix?: string;
  initial: string;
  label: string;
}

/**
 * Stat that counts up on entry, with the last two digits scrambling just
 * before it settles — the design's "instrument locking on" beat.
 * Reduced motion gets the final value immediately.
 */
export function Counter({ to, suffix = "", initial, label }: CounterProps) {
  const valueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = valueRef.current;
    if (!el) return;

    const final = to.toLocaleString("en-IN") + suffix;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = final;
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const duration = 1400;
        const digits = "0123456789";

        const step = () => {
          const e = Math.min(1, (performance.now() - start) / duration);
          if (e >= 0.93) {
            el.textContent = final;
            return;
          }
          const eased = 1 - Math.pow(1 - e, 3);
          let value = Math.round(to * eased).toLocaleString("en-IN");
          if (e > 0.78) {
            value = value
              .split("")
              .map((char, i) =>
                i >= value.length - 2 && /\d/.test(char)
                  ? (digits[Math.floor(Math.random() * 10)] ?? char)
                  : char,
              )
              .join("");
          }
          el.textContent = value + suffix;
          frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, suffix]);

  return (
    <div className="border-l border-hairline px-6 pt-8">
      <div
        ref={valueRef}
        className="font-display text-[clamp(28px,4vw,56px)] font-medium leading-none tracking-[-0.02em] text-strong"
      >
        {initial}
      </div>
      <div className="p1-mono mt-3 text-soft">{label}</div>
    </div>
  );
}
