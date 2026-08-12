"use client";

import Link from "next/link";

/**
 * Navigation pill.
 *
 * Descended from the supplied `PillBase`, now reduced to the part that earned
 * its place: a rounded glass bar floating over the page.
 *
 * What went, and why:
 *
 *   1. The plastic. The original is an opaque light-grey body (#fcfcfd →
 *      #e2e3e6) under nine stacked light layers — top ridge, hemisphere catch,
 *      key light, two gloss reflections, edge illumination, bottom curvature,
 *      contact shadow, inner glow. That stack is what made it read as a
 *      physical object on a white page, and it is also what kept the pill
 *      looking grey no matter how far the fill's alpha came down: the
 *      highlights were the grey. Real glass has no fill and no specular
 *      stack. What remains is a `backdrop-filter`, a hairline edge and a
 *      shadow to lift it off the page.
 *
 *   2. The hover expansion. The original collapses to the active label and
 *      expands on hover, which hides the navigation until it is pointed at
 *      and makes every destination a two-step reveal. All items are visible
 *      at all times now. With no width to animate between two states, the
 *      spring, the sizer nodes and the measurement that fed them are all
 *      gone too — the bar is simply as wide as its contents.
 *
 *   3. Scroll targets. The demo tracks a section id on one page; these are
 *      real routes, so items are `next/link` and the active one comes from
 *      the pathname.
 */

export interface PillNavItem {
  label: string;
  href: string;
}

interface PillBaseProps {
  items: PillNavItem[];
  /** Href of the item to mark as current. */
  activeHref: string;
  className?: string;
}

export function PillBase({
  items,
  activeHref,
  className = "",
}: PillBaseProps) {
  return (
    <nav
      aria-label="Primary"
      className={`relative flex h-14 items-center gap-1 rounded-full px-3 ${className}`}
      style={{
        // A pane, not a body. The fill is a 6%→2% sheen across the diagonal —
        // enough for the surface to catch light and read as a solid object,
        // far below the level where it starts to look like frosted plastic.
        // The nine-layer specular stack this component shipped with is what
        // made it grey; a single soft gradient does the same job at a tenth
        // of the weight.
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(16px) saturate(130%)",
        WebkitBackdropFilter: "blur(16px) saturate(130%)",
        boxShadow: `
          0 2px 8px rgba(0, 0, 0, 0.28),
          0 12px 32px rgba(0, 0, 0, 0.22),
          inset 0 1px 0 rgba(255, 255, 255, 0.14),
          inset 0 0 0 1px rgba(255, 255, 255, 0.09)
        `,
      }}
    >
      {/* Top-edge light catch — the one highlight worth keeping. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 rounded-t-full"
        style={{
          height: "45%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 55%, rgba(255,255,255,0) 100%)",
        }}
      />

      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`pill-label relative whitespace-nowrap rounded-full px-4 py-2.5 ${
              isActive ? "pill-label--active" : ""
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
