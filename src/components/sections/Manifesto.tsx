"use client";

import { useRef } from "react";
import { manifesto } from "@/data/site";
import { useScrollEffect } from "@/lib/motion";

const words = manifesto.text.split(" ");
const highlighted = new Set<number>(manifesto.highlight);

/**
 * Brand philosophy. The words rise out of their own baseline as the block
 * crosses the viewport — the statement assembles rather than fades in.
 * The full sentence is always in the DOM, so it reads normally to screen
 * readers and to anyone with reduced motion on.
 */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);

  useScrollEffect((vh) => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const rect = el.getBoundingClientRect();
    const p = Math.max(
      0,
      Math.min(1, (vh * 0.85 - rect.top) / (rect.height * 0.65)),
    );

    el.querySelectorAll<HTMLElement>("[data-p1-word]").forEach((word, i) => {
      const on = reduced || p > (i / words.length) * 0.9;
      word.style.transition = `transform 620ms var(--e-signal) ${reduced ? 0 : (i % 6) * 45}ms`;
      word.style.transform = on ? "translateY(0)" : "translateY(100%)";
    });
  });

  return (
    <section
      ref={ref}
      aria-label="Brand philosophy"
      className="relative gutter-x overflow-hidden border-t border-hairline py-24 lg:py-48"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 20% 50%,rgba(255,106,0,0) 0 64px,rgba(255,106,0,1) 64px 65px),repeating-radial-gradient(circle at 84% 40%,rgba(255,106,0,0) 0 78px,rgba(255,106,0,1) 78px 79px)",
        }}
      />
      <p className="p1-h-xl relative mx-auto max-w-[1180px] text-white">
        {words.map((word, index) => (
          <span key={index}>
            <span className="inline-block overflow-hidden align-bottom">
              <span
                data-p1-word=""
                className="inline-block"
                style={{
                  transform: "translateY(100%)",
                  color: highlighted.has(index) ? "var(--p1-signal)" : undefined,
                }}
              >
                {word}
              </span>
            </span>{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
