import {
  CoverflowCarousel,
  type CoverflowSlide,
} from "@/components/ui/coverflow-carousel";
import type { CategorySummary } from "@/types/product";

/**
 * Brand collections as a coverflow rack, same mechanism as the homepage
 * signal chain. Each card is one Shopify collection flagged `custom.brand`;
 * clicking it opens `/products?category=<handle>` — the same route the
 * category grid uses, so the brand lands on an ordinary filtered product
 * listing rather than a bespoke page.
 *
 * A brand without a collection image cannot be a card — the carousel has
 * nothing to paint — so it is filtered out here rather than left to render
 * broken.
 */
export function BrandCarousel({
  brands,
  eyebrow = "[ Shop by brand ]",
  title = "The brands we carry.",
}: {
  brands: CategorySummary[];
  eyebrow?: string;
  title?: string;
}) {
  const slides: CoverflowSlide[] = brands
    .filter((brand) => brand.image)
    .map((brand) => ({
      src: brand.image!.src,
      alt: brand.image!.alt,
      title: brand.name,
      href: `/products?category=${brand.slug}`,
    }));

  if (slides.length === 0) return null;

  return (
    <section
      aria-labelledby="brands-heading"
      className="gutter-x border-t border-hairline py-20 lg:py-28"
    >
      <div className="p1-shell">
        <div className="p1-eyebrow mb-6">{eyebrow}</div>
        <h2 id="brands-heading" className="p1-h2 mb-12 lg:mb-16">
          {title}
        </h2>

        <CoverflowCarousel
          slides={slides}
          label="Brand carousel"
          cardWidth="clamp(160px, 20vw, 240px)"
          captionHeight="4.5rem"
          showCaption={false}
          showNavigation
          showPagination
        />
      </div>
    </section>
  );
}
