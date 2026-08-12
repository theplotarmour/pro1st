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
      className={`relative flex h-11 items-center rounded-full px-2 ${className}`}
      style={{
        /*
          An outline, not an object. Almost-black fill, a 1px hairline, and
          just enough blur to separate it from whatever passes underneath —
          the pill should register as a drawn boundary and then get out of the
          way of the hero.

          No drop shadow, no highlight layer, no gradient. Each of those makes
          the bar read as a raised card floating above the page, which is
          exactly the weight this navigation should not carry.
        */
        background: "rgba(10, 10, 12, 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.10)",
      }}
    >
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`pill-label relative whitespace-nowrap rounded-full px-5 py-2 ${
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
