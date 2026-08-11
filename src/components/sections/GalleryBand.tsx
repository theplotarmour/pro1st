"use client";

import Link from "next/link";
import { useRef } from "react";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { useScrollEffect } from "@/lib/motion";
import type { GalleryShot } from "@/lib/products/repository";

/**
 * Product gallery — an image wall built from real catalogue photography.
 *
 * The store carries roughly five shots per product and only the first was ever
 * used. This surfaces the rest: detail shots, packaging, ports, application
 * photography. It is the section that makes the landing page feel like a
 * showroom rather than a spec list, and it costs no new assets.
 *
 * Tile sizes follow a fixed repeating rhythm — never random, so the layout is
 * identical on server and client and cannot shift on hydration.
 */

/** Repeating span pattern across a 6-column grid. */
const RHYTHM = [
  { col: 2, row: 2 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 2 },
  { col: 1, row: 1 },
];

export function GalleryBand({ shots }: { shots: GalleryShot[] }) {
  const ref = useRef<HTMLDivElement>(null);

  // A slow counter-drift per column gives the wall depth without parallaxing
  // every tile independently, which would thrash layout.
  useScrollEffect((vh) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > vh + 200) return;
    const p = (rect.top + rect.height / 2 - vh / 2) / vh;

    el.querySelectorAll<HTMLElement>("[data-p1-shot]").forEach((tile, i) => {
      const depth = (i % 3) - 1; // -1, 0, 1
      tile.style.transform = `translateY(${(p * depth * 18).toFixed(1)}px)`;
    });
  });

  if (shots.length === 0) return null;

  return (
    <section
      aria-labelledby="gallery-heading"
      className="gutter-x border-t border-hairline py-24 lg:py-32"
    >
      <div className="p1-shell">
        <Reveal className="mb-14">
          <div className="flex flex-wrap items-baseline justify-between gap-8">
            <div>
              <div className="p1-eyebrow mb-5">[ 05 — On the floor ]</div>
              <h2 id="gallery-heading" className="p1-h2">
                Close up.
              </h2>
            </div>
            <p className="m-0 max-w-[34ch] text-base leading-[1.6] text-[rgba(230,230,230,0.6)]">
              Ports, grilles, terminals and packing. The details that decide a
              reorder.
            </p>
          </div>
        </Reveal>

        <div
          ref={ref}
          className="grid auto-rows-[minmax(120px,auto)] grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4"
        >
          {shots.map((shot, i) => {
            const span = RHYTHM[i % RHYTHM.length]!;
            return (
              <Link
                key={`${shot.handle}-${shot.src}`}
                href={`/products/${shot.handle}`}
                data-p1-shot=""
                className="group relative overflow-hidden border border-hairline bg-panel transition-[border-color] duration-[420ms] ease-signal hover:border-signal"
                style={{
                  gridColumn: `span ${span.col}`,
                  gridRow: `span ${span.row}`,
                  minHeight: span.row * 120,
                  willChange: "transform",
                }}
              >
                <div className="absolute inset-0 transition-transform duration-[620ms] ease-signal group-hover:scale-[1.05] motion-reduce:transform-none">
                  <Media
                    src={shot.src}
                    alt={shot.alt}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
                  />
                </div>

                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[rgba(13,13,15,0.85)] via-transparent to-transparent opacity-0 transition-opacity duration-[420ms] ease-signal group-hover:opacity-100"
                />
                <span className="p1-mono absolute inset-x-3 bottom-3 translate-y-2 text-[10px] leading-tight text-white opacity-0 transition-[opacity,transform] duration-[420ms] ease-signal group-hover:translate-y-0 group-hover:opacity-100">
                  {shot.title}
                </span>
              </Link>
            );
          })}
        </div>

        <Link href="/products" className="p1-link mt-12">
          Open the full gallery →
        </Link>
      </div>
    </section>
  );
}
