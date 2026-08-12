"use client";

import { useState } from "react";
import { Media } from "@/components/ui/Media";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
}

/**
 * Product gallery.
 *
 * Every image is mounted at once and switching is a crossfade, rather than one
 * frame whose `src` is swapped.
 *
 * Swapping the source meant each thumbnail press started a fresh request for
 * the full-size optimised image and waited on the network and the decode
 * before anything appeared — on a slow connection that is seconds of blank
 * frame per click, every time, including going back to an image already seen.
 * Mounted together, the browser fetches them once and every later switch is a
 * composited opacity change.
 *
 * Only the first carries `priority` — it is the LCP and gets the preload. The
 * rest are `eager`, which fetches them straight away at normal priority
 * rather than leaving them to lazy loading: an element at `opacity: 0` still
 * intersects the viewport, so the browser is entitled to defer it forever,
 * and the reader ends up waiting on the network for an image that has been in
 * the DOM since the page loaded.
 */
export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden border border-hairline bg-panel">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 62%, var(--sig-12), transparent 60%)",
          }}
        />
        {images.length > 0 ? (
          images.map((image, index) => (
            <div
              key={image.src}
              // Only the visible frame is exposed; the rest are decoration
              // sitting underneath it.
              aria-hidden={index !== active}
              className="absolute inset-0 transition-opacity duration-300 ease-signal"
              style={{ opacity: index === active ? 1 : 0 }}
            >
              <Media
                src={image.src}
                alt={index === active ? image.alt || title : ""}
                fit="contain"
                priority={index === 0}
                eager
                sizes="(max-width: 1100px) 100vw, 55vw"
                className="p-8"
              />
            </div>
          ))
        ) : (
          <div className="grid h-full place-items-center">
            <span className="p1-mono text-faint">
              No image supplied
            </span>
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div
          className="flex flex-wrap gap-3"
          role="group"
          aria-label={`${title} images`}
        >
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
              className="relative h-20 w-20 cursor-pointer overflow-hidden border bg-panel transition-colors duration-200 ease-signal"
              style={{
                borderColor:
                  index === active
                    ? "var(--p1-signal)"
                    : "var(--p1-hairline)",
              }}
            >
              <Media src={image.src} alt="" fit="contain" sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
