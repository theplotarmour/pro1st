import Link from "next/link";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import type { CategorySummary } from "@/types/product";

/**
 * The product ecosystem as a browsable grid of real Shopify collections.
 *
 * This is the Arsenal page's own way of showing the range — deliberately not
 * the homepage's 360vh pinned signal chain, which belongs to the homepage and
 * turns any other page into an endless scroll.
 */
export function CategoryGrid({
  categories,
  eyebrow = "[ The ecosystem ]",
  title = "Every link in the chain.",
}: {
  categories: CategorySummary[];
  eyebrow?: string;
  title?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <section
      aria-labelledby="ecosystem-heading"
      className="gutter-x border-t border-hairline py-28 lg:py-40"
    >
      <div className="p1-shell">
        <Reveal className="mb-16 lg:mb-20">
          <div className="p1-eyebrow mb-5">{eyebrow}</div>
          <h2 id="ecosystem-heading" className="p1-h2">
            {title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-8">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group flex flex-col"
            >
              <div className="relative mb-6 aspect-square overflow-hidden border border-hairline bg-panel">
                {category.image ? (
                  <div className="absolute inset-0 transition-transform duration-[420ms] ease-signal group-hover:scale-[1.04] motion-reduce:transform-none">
                    <Media
                      src={category.image.src}
                      alt=""
                      sizes="(max-width: 768px) 50vw, 20vw"
                    />
                  </div>
                ) : null}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-ink/35 transition-opacity duration-[300ms] ease-signal group-hover:opacity-0"
                />
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-hairline pt-4">
                <h3 className="m-0 font-display text-[19px] font-medium tracking-[-0.01em] text-strong transition-colors duration-[200ms] ease-signal group-hover:text-signal">
                  {category.name}
                </h3>
                <span className="p1-mono text-faint">
                  {String(category.count).padStart(2, "0")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
