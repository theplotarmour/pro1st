/** Bullet list of client-supplied features. Absent when there are none. */
export function ProductFeatures({ features }: { features?: string[] }) {
  const items = (features ?? []).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="features-heading">
      <h2
        id="features-heading"
        className="p1-mono mb-6 text-[rgba(230,230,230,0.6)]"
      >
        Features
      </h2>
      <ul className="m-0 list-none border-t border-hairline p-0">
        {items.map((feature) => (
          <li
            key={feature}
            className="flex gap-4 border-b border-hairline py-4 text-[15px] leading-[1.6] text-[rgba(230,230,230,0.72)]"
          >
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 flex-none bg-signal" />
            {feature}
          </li>
        ))}
      </ul>
    </section>
  );
}
