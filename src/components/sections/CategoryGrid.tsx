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
      className="gutter-x border-t border-hairline py-24 lg:py-32"
    >
      <div className="p1-shell">
        <Reveal className="mb-14">
          <div className="p1-eyebrow mb-5">{eyebrow}</div>
          <h2 id="ecosystem-heading" className="p1-h2">
            {title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group flex flex-col border-b border-hairline pb-5"
            >
              <div className="relative mb-4 aspect-[4/3] overflow-hidden border border-hairline bg-panel">
                {category.image ? (
                  <div className="absolute inset-0 transition-transform duration-[420ms] ease-signal group-hover:scale-[1.04] motion-reduce:transform-none">
                    <Media
                      src={category.image.src}
                      alt=""
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="m-0 font-display text-[17px] font-medium tracking-[-0.01em] text-strong group-hover:text-signal">
                  {category.name}
                </h3>
                <span className="p1-mono text-soft">
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
