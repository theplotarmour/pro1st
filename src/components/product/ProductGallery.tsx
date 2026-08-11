"use client";

import { useState } from "react";
import { Media } from "@/components/ui/Media";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

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
        {current ? (
          <Media
            src={current.src}
            alt={current.alt || title}
            fit="contain"
            priority
            sizes="(max-width: 1100px) 100vw, 55vw"
            className="p-8"
          />
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
