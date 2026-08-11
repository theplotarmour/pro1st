"use client";

import { useEffect, useRef } from "react";
import { Media } from "@/components/ui/Media";
import { useScrollEffect } from "@/lib/motion";

/**
 * Hero product.
 *
 * This was a rotating pseudo-3D chassis built from six CSS faces, which only
 * reads correctly with a dark, cut-out product render. The real catalogue is
 * bright white-background e-commerce photography, so the box read as a photo
 * awkwardly wrapped around a slab — the illusion fought the asset.
 *
 * So it now does what premium product pages actually do with this kind of
 * photography: present it large and clean, floating on a signal glow, with a
 * slow drift and a slight tilt tied to scroll. Restrained, and it flatters the
 * assets that exist rather than the ones that don't.
 */
export function HeroChassis({ image, alt }: { image: string; alt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Fade in after mount so it arrives with the headline, not before it.
    requestAnimationFrame(() => {
      wrap.style.opacity = "1";
    });
  }, []);

  useScrollEffect((vh) => {
    const wrap = wrapRef.current;
    const frame = frameRef.current;
    if (!wrap || !frame) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const p = Math.min(1, window.scrollY / vh);
    wrap.style.opacity = String(Math.max(0, 1 - p * 1.5));

    if (reduced) {
      frame.style.transform = "none";
      return;
    }

    frame.style.transform =
      `translateY(${(p * -90).toFixed(1)}px)` +
      ` perspective(1600px) rotateY(${(-9 + p * 6).toFixed(2)}deg)` +
      ` rotateX(${(3 - p * 4).toFixed(2)}deg)`;
  });

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none relative z-0 hidden w-full opacity-0 transition-opacity duration-[900ms] ease-signal min-[1100px]:block"
    >
      {/* Signal bloom behind the unit, so it sits in light rather than on a plate. */}
      <div
        className="absolute -inset-[18%]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, var(--sig-24), transparent 65%)",
        }}
      />
      <div
        ref={frameRef}
        className="relative aspect-[4/3] overflow-hidden border border-hairline bg-panel"
        style={{ willChange: "transform", boxShadow: "var(--shadow-float)" }}
      >
        <Media src={image} alt={alt} fit="cover" sizes="520px" priority />
        {/* Grounds a bright product shot into the dark surface. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 55%, color-mix(in srgb, var(--surface-base) 55%, transparent))",
          }}
        />
      </div>
    </div>
  );
}
