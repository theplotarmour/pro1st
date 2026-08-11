import type { ReactNode } from "react";

interface SectionHeadingProps {
  /** Mono eyebrow, e.g. "[ 04 — On the floor ]". */
  eyebrow?: string;
  title: ReactNode;
  /** Right-hand supporting paragraph, as in the design's split headers. */
  lead?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
  /** Constrain the headline measure, in ch. */
  titleWidth?: number;
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  as: Tag = "h2",
  className = "",
  titleWidth,
}: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-wrap items-baseline justify-between gap-6 md:gap-8 ${className}`.trim()}
    >
      <div>
        {eyebrow ? <div className="p1-eyebrow mb-5">{eyebrow}</div> : null}
        <Tag
          className="p1-h2"
          style={titleWidth ? { maxWidth: `${titleWidth}ch` } : undefined}
        >
          {title}
        </Tag>
      </div>
      {lead ? (
        <p className="m-0 max-w-[34ch] text-base leading-[1.6] text-[rgba(230,230,230,0.6)]">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
