"use client";

import { useRef } from "react";
import { useScrollEffect } from "@/lib/motion";
import { Media } from "./Media";

interface ParallaxMediaProps {
  src: string;
  alt: string;
  /** Frame aspect ratio, e.g. "4 / 5". */
  ratio?: string;
  sizes?: string;
  className?: string;
}

/** Editorial image with a ±40px vertical drift. Static under reduced motion. */
export function ParallaxMedia({
  src,
  alt,
  ratio = "4 / 5",
  sizes = "(max-width: 1100px) 100vw, 40vw",
  className = "",
}: ParallaxMediaProps) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollEffect((vh) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const p = (rect.top + rect.height / 2 - vh / 2) / vh;
    el.style.transform = `translateY(${Math.max(-40, Math.min(40, -p * 40))}px)`;
  });

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden border border-hairline bg-panel ${className}`.trim()}
      style={{ aspectRatio: ratio }}
    >
      <Media src={src} alt={alt} sizes={sizes} />
    </div>
  );
}
