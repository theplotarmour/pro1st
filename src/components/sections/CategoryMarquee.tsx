"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import type { MarqueeItem } from "@/lib/content/sections";
import { useAnimationFrame } from "@/lib/motion";

/**
 * Category rail. It drifts on its own and takes its direction and speed from
 * the reader's scroll — the page's own momentum, not a fixed loop.
 * Under reduced motion it becomes a normal horizontally-scrollable list.
 */
export function CategoryMarquee({ items }: { items: MarqueeItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const state = useRef({ offset: 0, direction: 1, velocity: 0, lastY: 0 });

  useAnimationFrame(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const s = state.current;
    const y = window.scrollY;
    s.velocity += y - s.lastY;
    s.lastY = y;

    if (s.velocity > 0.5) s.direction = 1;
    else if (s.velocity < -0.5) s.direction = -1;

    const speed = 0.55 + Math.min(4, Math.abs(s.velocity) * 0.08);
    s.offset -= speed * s.direction;

    const half = track.scrollWidth / 2 || 1;
    if (s.offset <= -half) s.offset += half;
    if (s.offset > 0) s.offset -= half;

    track.style.transform = `translateX(${s.offset}px)`;
    s.velocity *= 0.86;
  });

  // Doubled so the wrap-around is seamless in both directions.
  const loop = [...items, ...items];

  return (
    <section
      aria-label="Product categories"
      className="flex h-16 items-center overflow-x-auto border-y border-hairline bg-steel motion-reduce:overflow-x-auto"
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap"
        style={{ willChange: "transform" }}
      >
        {loop.map((item, index) => (
          <Link
            key={`${item.label}-${index}`}
            href={`/products?category=${item.slug}`}
            aria-hidden={index >= items.length}
            tabIndex={index >= items.length ? -1 : undefined}
            className="inline-flex items-center gap-5 px-3.5 font-display text-xl font-medium tracking-[-0.01em] text-body transition-colors duration-[120ms] ease-signal hover:text-signal"
          >
            {item.image ? (
              <Image
                src={item.image.src}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                className="h-10 w-10 flex-none border border-hairline object-cover"
              />
            ) : null}
            {item.label}
            <span
              aria-hidden="true"
              className="h-[5px] w-[5px] flex-none rounded-full bg-signal"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
