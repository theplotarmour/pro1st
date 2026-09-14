"use client";

import Image from "next/image";
import { useRef } from "react";
import { useAnimationFrame } from "@/lib/motion";

/**
 * Brand logos, served straight from `public/Pro1ST Brand Carousel`. No CMS
 * or Shopify metafield holds this list — it's the client's own logo pack,
 * so the filenames are the source of truth and double as the alt text.
 */
const BRAND_DIR = "/Pro1ST Brand Carousel";
const BRAND_FILES = [
  "A Plus.png",
  "Dapic & Showa Tweetors.png",
  "Desire.png",
  "G&S.png",
  "G.S.png",
  "German Audio.png",
  "HRD Network.png",
  "Lane Microphone.png",
  "Maxim.png",
  "MX.png",
  "P Audio.png",
  "Pro-Max.png",
  "S.L.V.png",
];

/**
 * Same scroll-momentum drift as CategoryMarquee, on a white band. Kept a
 * separate component rather than reusing CategoryMarquee: that one renders
 * text labels with category links, this one renders only logo marks with no
 * link target — different content shape, not a themed variant of the same
 * thing.
 */
export function BrandMarquee() {
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

  const loop = [...BRAND_FILES, ...BRAND_FILES];

  return (
    <section
      aria-label="Brands we carry"
      className="theme-light flex h-28 items-center overflow-x-auto border-y border-hairline bg-white motion-reduce:overflow-x-auto"
    >
      <div
        ref={trackRef}
        className="flex items-center whitespace-nowrap"
        style={{ willChange: "transform" }}
      >
        {loop.map((file, index) => {
          const isDuplicate = index >= BRAND_FILES.length;
          return (
            <div
              key={`${file}-${index}`}
              aria-hidden={isDuplicate}
              className="inline-flex h-28 w-[168px] flex-none items-center justify-center px-8"
            >
              <Image
                src={`${BRAND_DIR}/${encodeURIComponent(file)}`}
                alt={isDuplicate ? "" : file.replace(/\.png$/i, "")}
                width={128}
                height={56}
                loading="lazy"
                className="max-h-11 w-auto object-contain opacity-70 grayscale transition duration-[200ms] ease-signal hover:opacity-100 hover:grayscale-0"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
