"use client";

import type { ReactNode } from "react";
import { useGsapContext } from "@/lib/motion/gsap";

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
  /** Set false on headings that already sit inside a Reveal. */
  animate?: boolean;
}

/**
 * Section header, with one scroll-linked flourish: a hairline rule that draws
 * across the full width as the heading enters.
 *
 * It is deliberately the only GSAP work on the page body. The rise-and-fade
 * reveal every block already uses is IntersectionObserver plus CSS and stays
 * that way — re-implementing it in GSAP would buy nothing and cost 50kB. A
 * rule that draws in step with scroll is the thing CSS cannot do, so that is
 * what GSAP is here for.
 *
 * Not scrubbed. A rule that un-draws when you scroll back up reads as a toy;
 * this plays once, forward, and stays.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  as: Tag = "h2",
  className = "",
  titleWidth,
  animate = true,
}: SectionHeadingProps) {
  const ref = useGsapContext<HTMLDivElement>(
    (gsap, scope) => {
      if (!animate) return;
      const rule = scope.querySelector("[data-heading-rule]");
      if (!rule) return;

      gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: scope, start: "top 82%", once: true },
        },
      );
    },
    [animate],
  );

  return (
    <div ref={ref} className={className || undefined}>
      <div className="flex flex-wrap items-baseline justify-between gap-6 md:gap-8">
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
          <p className="m-0 max-w-[34ch] text-base leading-[1.6] text-muted">
            {lead}
          </p>
        ) : null}
      </div>

      {animate ? (
        <div
          aria-hidden="true"
          data-heading-rule=""
          className="mt-8 h-px w-full origin-left bg-hairline"
        />
      ) : null}
    </div>
  );
}
