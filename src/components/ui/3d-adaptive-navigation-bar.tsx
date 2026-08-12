"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * 3D adaptive navigation pill.
 *
 * The supplied `PillBase`, kept in structure: a pill that shows only the
 * current section, expands on hover to reveal every item, and collapses again
 * after a short grace period. All nine stacked light layers are preserved —
 * top ridge, hemisphere catch, directional key light, two gloss reflections,
 * left/right edge treatment, bottom curvature and contact shadow, inner glow
 * and micro edge — because that stack is what reads as a physical object
 * rather than a rounded rectangle.
 *
 * Three adaptations:
 *
 *   1. Tint. The original is an opaque light-grey plastic (#fcfcfd → #e2e3e6)
 *      designed for a white page. This asked for orange glass, so the body is
 *      now a translucent signal-orange gradient over `backdrop-filter`, the
 *      white specular highlights are warmed, and the shadow stack is deepened
 *      for a dark surface — black shadows at 0.08 opacity are invisible on
 *      #0d0d0f. Text switches to the light-on-dark tokens.
 *
 *   2. Width. The original hardcodes 140px collapsed / 580px expanded, which
 *      fits its four demo labels ("Home", "Problem", "Solution", "Contact")
 *      and nothing else. PRO1ST has up to six, including "System Packages"
 *      and "Support & FAQ", so a fixed 580 clips them. Both widths are
 *      measured off always-rendered sizer nodes instead. The sizers use
 *      `visibility: hidden`, never `display: none` — a display:none node has
 *      no box to measure, which is what produced an empty pill before.
 *
 *   3. Links, not scroll targets. The demo tracks a section id on one page.
 *      These are real routes, so items are `next/link` and the active item
 *      comes from the pathname.
 *
 * No framer-motion. Width, opacity and blur are CSS transitions; the spring
 * was the only thing the dependency was buying and a spring that overshoots a
 * measured width just reintroduces the clipping.
 */

export interface PillNavItem {
  label: string;
  href: string;
  /** Opens the category panel on pointer/focus rather than only navigating. */
  hasMegaMenu?: boolean;
}

interface PillBaseProps {
  items: PillNavItem[];
  /** Href of the item to show while collapsed. */
  activeHref: string;
  onMegaMenuEnter?: () => void;
  className?: string;
}

const COLLAPSE_DELAY_MS = 600;
/** Breathing room either side of the measured content. */
const PILL_PADDING = 48;

export function PillBase({
  items,
  activeHref,
  onMegaMenuEnter,
  className = "",
}: PillBaseProps) {
  const [expanded, setExpanded] = useState(false);
  const [collapsedWidth, setCollapsedWidth] = useState(140);
  const [expandedWidth, setExpandedWidth] = useState(580);

  const collapsedSizerRef = useRef<HTMLDivElement>(null);
  const expandedSizerRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeItem = items.find((item) => item.href === activeHref) ?? items[0];

  // Both sizers are laid out for real at all times, so a measurement is always
  // available — including on the very first paint, before any hover.
  useLayoutEffect(() => {
    const measure = () => {
      const collapsed = collapsedSizerRef.current;
      const expandedNode = expandedSizerRef.current;
      if (collapsed) {
        setCollapsedWidth(
          Math.round(collapsed.getBoundingClientRect().width) + PILL_PADDING,
        );
      }
      if (expandedNode) {
        setExpandedWidth(
          Math.round(expandedNode.getBoundingClientRect().width) +
            PILL_PADDING,
        );
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (collapsedSizerRef.current) observer.observe(collapsedSizerRef.current);
    if (expandedSizerRef.current) observer.observe(expandedSizerRef.current);

    // Labels reflow once the variable fonts land; re-measure rather than
    // freezing the fallback-font width.
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [items, activeItem?.label]);

  useEffect(
    () => () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    },
    [],
  );

  const open = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setExpanded(true);
  };

  const close = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(
      () => setExpanded(false),
      COLLAPSE_DELAY_MS,
    );
  };

  return (
    <nav
      aria-label="Primary"
      onMouseEnter={open}
      onMouseLeave={close}
      onFocusCapture={open}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          close();
        }
      }}
      className={`relative rounded-full ${className}`}
      style={{
        width: expanded ? expandedWidth : collapsedWidth,
        height: 56,
        overflow: "hidden",
        background: `linear-gradient(135deg,
          rgba(255, 158, 74, 0.72) 0%,
          rgba(255, 132, 32, 0.68) 18%,
          rgba(255, 106, 0, 0.66) 38%,
          rgba(246, 100, 0, 0.64) 58%,
          rgba(228, 90, 0, 0.66) 78%,
          rgba(206, 80, 0, 0.72) 100%
        )`,
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
        boxShadow: expanded
          ? `0 2px 4px rgba(0, 0, 0, 0.30),
             0 6px 12px rgba(0, 0, 0, 0.36),
             0 12px 24px rgba(0, 0, 0, 0.40),
             0 24px 48px rgba(0, 0, 0, 0.34),
             inset 0 2px 2px rgba(255, 210, 170, 0.42),
             inset 0 -3px 8px rgba(0, 0, 0, 0.34),
             inset 3px 3px 8px rgba(255, 160, 90, 0.12),
             inset -3px 3px 8px rgba(0, 0, 0, 0.26),
             inset 0 0 0 0.5px rgba(255, 176, 112, 0.30)`
          : `0 3px 6px rgba(0, 0, 0, 0.32),
             0 8px 16px rgba(0, 0, 0, 0.30),
             0 16px 32px rgba(0, 0, 0, 0.26),
             inset 0 2px 1px rgba(255, 210, 170, 0.34),
             inset 0 -2px 6px rgba(0, 0, 0, 0.30),
             inset 2px 2px 8px rgba(255, 160, 90, 0.10),
             inset -2px 2px 8px rgba(0, 0, 0, 0.22),
             inset 0 0 0 0.5px rgba(255, 176, 112, 0.24)`,
        transition:
          "width 420ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 300ms ease-out",
      }}
    >
      {/* Top edge ridge — warm rather than pure white. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 rounded-t-full"
        style={{
          height: 2,
          background:
            "linear-gradient(90deg, rgba(255,214,178,0) 0%, rgba(255,214,178,0.75) 5%, rgba(255,228,203,0.92) 15%, rgba(255,228,203,0.92) 85%, rgba(255,214,178,0.75) 95%, rgba(255,214,178,0) 100%)",
          filter: "blur(0.3px)",
        }}
      />

      {/* Top hemisphere light catch. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 rounded-full"
        style={{
          height: "55%",
          background:
            "linear-gradient(180deg, rgba(255,186,110,0.20) 0%, rgba(255,166,80,0.10) 30%, rgba(255,150,60,0.04) 60%, rgba(255,150,60,0) 100%)",
        }}
      />

      {/* Directional key light, top-left. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,198,132,0.18) 0%, rgba(255,178,100,0.09) 20%, rgba(255,164,80,0.03) 40%, rgba(255,164,80,0) 65%)",
        }}
      />

      {/* Primary gloss reflection. */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          left: expanded ? "18%" : "15%",
          top: "16%",
          width: expanded ? 140 : 60,
          height: 14,
          background:
            "radial-gradient(ellipse at center, rgba(255,224,190,0.45) 0%, rgba(255,200,150,0.20) 40%, rgba(255,190,130,0.05) 70%, rgba(255,190,130,0) 100%)",
          filter: "blur(4px)",
          transform: "rotate(-12deg)",
          transition: "all 300ms ease",
        }}
      />

      {/* Secondary gloss accent. */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          right: "22%",
          top: "20%",
          width: 80,
          height: 10,
          background:
            "radial-gradient(ellipse at center, rgba(255,232,206,0.38) 0%, rgba(255,216,182,0.11) 60%, rgba(255,216,182,0) 100%)",
          filter: "blur(3px)",
          transform: "rotate(8deg)",
          opacity: expanded ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      />

      {/* Left edge illumination / right edge shadow. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 rounded-l-full"
        style={{
          width: "35%",
          background:
            "linear-gradient(90deg, rgba(255,220,186,0.16) 0%, rgba(255,210,170,0.08) 40%, rgba(255,210,170,0.02) 70%, rgba(255,210,170,0) 100%)",
          opacity: expanded ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 rounded-r-full"
        style={{
          width: "35%",
          background:
            "linear-gradient(270deg, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0.13) 40%, rgba(0,0,0,0.05) 70%, rgba(0,0,0,0) 100%)",
          opacity: expanded ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      />

      {/* Bottom curvature and contact shadow. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-full"
        style={{
          height: "50%",
          background:
            "linear-gradient(0deg, rgba(92,26,0,0.34) 0%, rgba(92,26,0,0.18) 25%, rgba(92,26,0,0.06) 50%, rgba(92,26,0,0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-full"
        style={{
          height: "20%",
          background:
            "linear-gradient(0deg, rgba(74,20,0,0.38) 0%, rgba(74,20,0,0) 100%)",
          filter: "blur(2px)",
        }}
      />

      {/* Inner diffuse glow. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow: "inset 0 0 40px rgba(255, 150, 70, 0.20)",
          opacity: 0.7,
        }}
      />

      {/*
        Sizers. Laid out and measurable at all times, hidden with `visibility`
        so they never paint and are never read aloud. `inert` keeps their links
        out of the tab order.
      */}
      <div
        aria-hidden="true"
        // @ts-expect-error — `inert` is valid HTML; React 19 types lag here.
        inert=""
        className="pointer-events-none absolute left-0 top-0 flex h-full items-center"
        style={{ visibility: "hidden", width: "max-content" }}
      >
        <div ref={collapsedSizerRef} style={{ width: "max-content" }}>
          <span className="pill-label pill-label--active">
            {activeItem?.label}
          </span>
        </div>
      </div>
      <div
        aria-hidden="true"
        // @ts-expect-error — `inert` is valid HTML; React 19 types lag here.
        inert=""
        className="pointer-events-none absolute left-0 top-0 flex h-full items-center"
        style={{ visibility: "hidden", width: "max-content" }}
      >
        <div ref={expandedSizerRef} className="flex" style={{ width: "max-content" }}>
          {items.map((item) => (
            <span key={item.href} className="pill-label px-4">
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Content. */}
      <div className="relative z-10 flex h-full items-center justify-center px-6">
        {/* Collapsed: the current route only. */}
        <span
          aria-hidden={expanded}
          className="pill-label pill-label--active absolute"
          style={{
            opacity: expanded ? 0 : 1,
            transform: expanded ? "translateY(-8px)" : "translateY(0)",
            filter: expanded ? "blur(4px)" : "blur(0px)",
            transition:
              "opacity 260ms ease, transform 260ms ease, filter 260ms ease",
            pointerEvents: "none",
          }}
        >
          {activeItem?.label}
        </span>

        {/* Expanded: every route. */}
        <div
          className="flex w-full items-center justify-evenly"
          style={{
            opacity: expanded ? 1 : 0,
            transform: expanded ? "translateY(0)" : "translateY(6px)",
            filter: expanded ? "blur(0px)" : "blur(4px)",
            transition:
              "opacity 300ms ease 80ms, transform 300ms ease 80ms, filter 300ms ease 80ms",
            pointerEvents: expanded ? "auto" : "none",
          }}
        >
          {items.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={expanded ? 0 : -1}
                aria-current={isActive ? "page" : undefined}
                onMouseEnter={
                  item.hasMegaMenu ? onMegaMenuEnter : undefined
                }
                onFocus={item.hasMegaMenu ? onMegaMenuEnter : undefined}
                onClick={() => setExpanded(false)}
                className={`pill-label whitespace-nowrap px-4 py-2.5 ${
                  isActive ? "pill-label--active" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
