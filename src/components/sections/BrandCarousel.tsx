import { Carousel3D, type Carousel3DSlide } from "@/components/ui/3d-carousel";
import type { CategorySummary } from "@/types/product";

/**
 * Brand collections as a drag-rotated 3D ring (see `ui/3d-carousel`).
 * Clicking a card opens `/products?category=<handle>` — the same route the
 * category grid uses, so the brand lands on an ordinary filtered product
 * listing rather than a bespoke page.
 *
 * A brand without a collection image has nothing to put on a face, so it is
 * filtered out here rather than left to render broken.
 */
export function BrandCarousel({
  brands,
  eyebrow = "[ Shop by brand ]",
}: {
  brands: CategorySummary[];
  eyebrow?: string;
}) {
  const slides: Carousel3DSlide[] = brands
    .filter((brand) => brand.image)
    .map((brand) => ({
      src: brand.image!.src,
      alt: brand.image!.alt,
      title: brand.name,
      href: `/products?category=${brand.slug}`,
    }));

  if (slides.length === 0) return null;

  return (
    <section aria-label="Brand collections" className="border-y border-hairline py-10 lg:py-14">
      <div className="p1-eyebrow gutter-x mb-6">{eyebrow}</div>

      <div className="h-[320px] w-full overflow-hidden sm:h-[380px]">
        <Carousel3D slides={slides} label="Brand carousel" />
      </div>
    </section>
  );
}
