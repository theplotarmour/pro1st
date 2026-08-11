import Link from "next/link";
import type { ProductSpecification } from "@/types/product";

interface ProductSpecsProps {
  specifications?: ProductSpecification[];
  /** Where to send someone when the figures aren't published yet. */
  enquiryHref?: string;
}

/**
 * Technical specifications table.
 *
 * Renders only what the catalogue actually contains. Where the client has not
 * supplied figures, it says so and offers a route to a person — it never
 * fills the table with plausible-looking numbers.
 */
export function ProductSpecs({
  specifications,
  enquiryHref,
}: ProductSpecsProps) {
  const rows = (specifications ?? []).filter(
    (row) => row.label && row.value,
  );

  return (
    <section aria-labelledby="specs-heading">
      <h2 id="specs-heading" className="p1-mono mb-6 text-[rgba(230,230,230,0.6)]">
        Technical specifications
      </h2>

      {rows.length > 0 ? (
        <dl className="m-0 border-t border-hairline">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-4 border-b border-hairline py-4"
            >
              <dt className="p1-mono text-[rgba(230,230,230,0.45)]">
                {row.label}
              </dt>
              <dd className="m-0 text-right font-mono text-[13px] text-ash">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="border border-hairline bg-panel px-5 py-6">
          <p className="p1-mono m-0 normal-case tracking-[0.04em] text-[rgba(230,230,230,0.45)]">
            Published specifications aren&apos;t available for this unit yet.
          </p>
          {enquiryHref ? (
            <Link href={enquiryHref} className="p1-link mt-5 inline-flex">
              Request a spec sheet →
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
