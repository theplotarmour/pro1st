import Link from "next/link";
import type { CSSProperties } from "react";
import { Media } from "@/components/ui/Media";
import type { CategorySummary } from "@/types/product";

/**
 * Brand collections as a thin, self-running strip — not the coverflow rack
 * the signal chain uses. This is a trust-bar read (logos in a row, always
 * moving), not an editorial moment the reader is meant to stop and browse.
 *
 * Same loop mechanism as the testimonial columns (`p1-marquee-track`, see
 * globals.css): the row is rendered twice and the track translates to
 * exactly -50%, so the seam is invisible. `p1-marquee-track-x` is the
 * horizontal sibling of that keyframe, added for this component — it drifts
 * left continuously rather than the testimonials' vertical drift.
 *
 * Every brand logo here is a mark built for a white label or catalogue page
 * — dark type, no background of its own — because that is what a
 * distributor's brand asset kit ships. Dropped straight onto this site's
 * near-black ground the wordmark disappears. Rather than trying to invert
 * arbitrary third-party artwork (fragile, and wrong for any logo that
 * *does* carry colour), each one sits on its own small white chip, which is
 * the standard treatment for exactly this situation — see any dark-mode
 * "as featured in" strip.
 */
export function BrandCarousel({
  brands,
  eyebrow = "[ Shop by brand ]",
}: {
  brands: CategorySummary[];
  eyebrow?: string;
}) {
  const withLogo = brands.filter((brand) => brand.image);
  if (withLogo.length === 0) return null;

  // Roughly constant drift speed regardless of how many brands are live —
  // a fixed duration would speed up or crawl as the count changes.
  const duration = Math.max(18, withLogo.length * 3.5);

  return (
    <section
      aria-label="Brand collections"
      className="border-y border-hairline py-8 lg:py-10"
    >
      <div className="p1-eyebrow gutter-x mb-5">{eyebrow}</div>

      <div
        className="p1-marquee overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
        }}
      >
        <div
          className="p1-marquee-track-x flex w-max items-center gap-8"
          style={{ "--p1-marquee-duration": `${duration}s` } as CSSProperties}
        >
          {/* Rendered twice, same seamless-loop trick as the vertical
              marquee — the duplicate is hidden and untabbable. */}
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex flex-none items-center gap-8"
              aria-hidden={copy === 1 ? "true" : undefined}
            >
              {withLogo.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/products?category=${brand.slug}`}
                  tabIndex={copy === 1 ? -1 : 0}
                  className="relative h-12 w-28 flex-none border border-hairline bg-white transition-opacity hover:opacity-90"
                >
                  <Media
                    src={brand.image!.src}
                    alt={brand.name}
                    fit="contain"
                    sizes="112px"
                    className="p-2"
                  />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
