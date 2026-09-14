import Link from "next/link";
import type { CSSProperties } from "react";
import type { CategorySummary } from "@/types/product";

/**
 * Brand collections as a solid-orange text ribbon, always drifting left.
 * Text rather than logos — no per-brand image legibility problem to solve,
 * so every brand collection can appear here, not just the ones with a
 * collection image set.
 *
 * Same seamless-loop mechanism as the testimonial columns
 * (`p1-marquee-track`, globals.css): the row is rendered twice and the
 * track translates to exactly -50%, so the seam is invisible.
 * `p1-marquee-track-x` is the horizontal sibling of that keyframe.
 *
 * Clicking a name opens `/products?category=<handle>` — the same route the
 * category grid uses, so it lands on an ordinary filtered product listing.
 */
export function BrandCarousel({ brands }: { brands: CategorySummary[] }) {
  if (brands.length === 0) return null;

  const duration = Math.max(18, brands.length * 3);

  return (
    <section aria-label="Brand collections" className="overflow-hidden bg-signal py-7 mt-6 lg:mt-10 lg:py-10">
      <div className="p1-marquee">
        <div
          className="p1-marquee-track-x flex w-max items-center"
          style={{ "--p1-marquee-duration": `${duration}s` } as CSSProperties}
        >
          {/* Rendered twice, same seamless-loop trick as the vertical
              marquee — the duplicate is hidden and untabbable. */}
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex flex-none items-center"
              aria-hidden={copy === 1 ? "true" : undefined}
            >
              {brands.map((brand) => (
                <span key={brand.slug} className="flex flex-none items-center">
                  <Link
                    href={`/products?category=${brand.slug}`}
                    tabIndex={copy === 1 ? -1 : 0}
                    className="px-8 font-display text-2xl font-black uppercase tracking-wide text-[#0d0d0f] transition-transform duration-200 ease-signal hover:scale-105 hover:opacity-70 lg:text-3xl"
                  >
                    {brand.name}
                  </Link>
                  <span aria-hidden="true" className="h-2.5 w-2.5 flex-none rounded-full bg-[#0d0d0f]" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
