interface ProductFeaturesProps {
  items?: string[];
  title?: string;
  id?: string;
}

/**
 * Bullet list of client-supplied points — features or applications.
 * Renders nothing when the metafield is absent, rather than an empty heading.
 */
export function ProductFeatures({
  items,
  title = "Features",
  id = "features",
}: ProductFeaturesProps) {
  const entries = (items ?? []).filter((item) => item.trim() !== "");
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2
        id={`${id}-heading`}
        className="p1-mono mb-6 text-[rgba(230,230,230,0.6)]"
      >
        {title}
      </h2>
      <ul className="m-0 list-none border-t border-hairline p-0">
        {entries.map((entry) => (
          <li
            key={entry}
            className="flex gap-4 border-b border-hairline py-4 text-[15px] leading-[1.6] text-[rgba(230,230,230,0.72)]"
          >
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 flex-none bg-signal"
            />
            {entry}
          </li>
        ))}
      </ul>
    </section>
  );
}
