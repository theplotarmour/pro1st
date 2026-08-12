/**
 * Star rating, drawn rather than typed.
 *
 * A glyph like ★ inherits whatever the body face does with it and sits on the
 * text baseline, which is why star rows in most storefronts look slightly
 * crooked. This is one path, sized in em so it tracks the type around it, and
 * partial fills use a clip rather than a second greyed row.
 */

interface StarsProps {
  /** 0–5, fractional allowed. */
  value: number;
  /** Star height, any CSS length. Defaults to the current font size. */
  size?: string;
  className?: string;
  /** Omit when an adjacent label already states the rating. */
  label?: string;
}

const STAR_PATH =
  "M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z";

export function Stars({ value, size = "1em", className = "", label }: StarsProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const percent = (clamped / 5) * 100;

  return (
    <span
      className={`relative inline-flex flex-none align-middle ${className}`.trim()}
      style={{ height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Row tone="var(--hairline-strong)" size={size} />
      {/*
        The filled row is clipped to the score. `overflow: hidden` on a
        percentage width is exact at any fraction, where rendering four solid
        stars and a half-star glyph is not.
      */}
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${percent}%` }}
      >
        <Row tone="var(--signal)" size={size} />
      </span>
    </span>
  );
}

function Row({ tone, size }: { tone: string; size: string }) {
  return (
    <span className="flex flex-none" style={{ height: size }}>
      {[0, 1, 2, 3, 4].map((index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          fill={tone}
          aria-hidden="true"
          style={{ height: size, width: size, flex: "none" }}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}
