"use client";

import Image from "next/image";
import { useState } from "react";

interface MediaProps {
  src: string;
  alt: string;
  /** `cover` fills the frame; `contain` is for isolated product shots. */
  fit?: "cover" | "contain";
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Skip lazy-loading for above-the-fold media. */
  quality?: number;
}

/**
 * Product/editorial image with a designed failure state — a dead remote asset
 * must not leave a browser-default broken-image glyph in a dark UI.
 * Always fills its positioned parent.
 */
export function Media({
  src,
  alt,
  fit = "cover",
  sizes = "(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw",
  priority = false,
  className = "",
  quality,
}: MediaProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="absolute inset-0 grid place-items-center bg-panel px-4 text-center"
        role="img"
        aria-label={alt}
      >
        <span className="p1-mono text-faint">
          Image unavailable
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      onError={() => setFailed(true)}
      className={className}
      style={{ objectFit: fit }}
    />
  );
}
