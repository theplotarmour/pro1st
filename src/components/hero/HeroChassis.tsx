"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Media } from "@/components/ui/Media";
import type { HeroUnit } from "@/lib/content/sections";
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
export function HeroChassis({ unit }: { unit: HeroUnit }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLAnchorElement>(null);

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
      className="relative z-0 hidden w-full opacity-0 transition-opacity duration-[900ms] ease-signal min-[1100px]:block"
    >
      {/* Signal bloom behind the unit, so it sits in light rather than on a plate. */}
      <div
        className="absolute -inset-[18%]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, var(--sig-24), transparent 65%)",
        }}
      />
      <Link
        href={`/products/${unit.handle}`}
        ref={frameRef}
        aria-label={`${unit.title} — ${unit.price}`}
        className="group relative block aspect-[4/3] overflow-hidden border border-hairline bg-panel"
        style={{ willChange: "transform", boxShadow: "var(--shadow-float)" }}
      >
        {unit.image ? (
          <Media
            src={unit.image.src}
            alt={unit.image.alt}
            fit="cover"
            sizes="560px"
            priority
          />
        ) : null}
        {/* Grounds a bright product shot and carries the label. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 30%, color-mix(in srgb, var(--surface-base) 72%, transparent) 62%, var(--surface-base) 100%)",
          }}
        />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
          <div className="min-w-0">
            <div className="p1-mono text-soft">{unit.category}</div>
            <div className="mt-2 truncate font-display text-[19px] font-medium text-strong">
              {unit.title}
            </div>
            <div className="mt-1 font-display text-[19px] font-medium text-signal">
              {unit.price}
            </div>
          </div>
          <span className="p1-mono flex-none whitespace-nowrap border border-hairline px-3 py-2 text-ash transition-[border-color,color] duration-[160ms] ease-signal group-hover:border-signal group-hover:text-signal">
            View →
          </span>
        </div>
      </Link>
    </div>
  );
}
