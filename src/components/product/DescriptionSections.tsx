import { parseDescription } from "@/lib/products/description";

/**
 * Product description: the opening passage in full, everything the merchant
 * put under a heading behind a disclosure.
 *
 * Native `<details>`, not a JS accordion. It is keyboard operable, findable by
 * the browser's own in-page search, works before hydration, and costs nothing
 * — none of which is true of a `useState` toggle, and all of which matter on
 * a page whose whole point is a buyer comparing specifications.
 *
 * The first section is open by default. Collapsing everything hides the fact
 * that specifications exist at all, which on a professional audio product is
 * the information people came for.
 */
export function DescriptionSections({
  descriptionHtml,
  fallback,
}: {
  descriptionHtml?: string;
  fallback?: string;
}) {
  const { intro, sections } = parseDescription(descriptionHtml);

  if (!descriptionHtml) {
    return fallback ? (
      <p className="p1-body mt-7 max-w-[54ch] whitespace-pre-line">{fallback}</p>
    ) : null;
  }

  return (
    <div className="mt-7">
      {intro ? (
        <div
          className="p1-prose max-w-[62ch]"
          dangerouslySetInnerHTML={{ __html: intro }}
        />
      ) : null}

      {sections.length > 0 ? (
        <div className="mt-8 border-t border-hairline">
          {sections.map((section, index) => (
            <details
              key={section.title}
              open={index === 0}
              className="group border-b border-hairline"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                <span className="p1-mono text-muted transition-colors group-hover:text-strong">
                  {section.title}
                </span>
                {/*
                  Rotated with CSS off the open state rather than swapped for a
                  minus glyph — one element, and it animates.
                */}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--signal)"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="flex-none transition-transform duration-200 group-open:rotate-45"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div
                className="p1-prose max-w-[62ch] pb-6"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}
