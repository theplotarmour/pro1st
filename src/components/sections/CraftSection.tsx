"use client";

import { useRef } from "react";
import { Media } from "@/components/ui/Media";
import type { CraftPanel } from "@/lib/content/sections";
import { sectionProgress, useMediaQuery, useScrollEffect } from "@/lib/motion";

/**
 * "Craft" — three engineering panels that traverse horizontally as the page
 * scrolls, with each image counter-drifting inside its frame.
 *
 * Below 900px the track becomes a normal vertical stack. Sideways scroll
 * hijacking on a phone is a worse read, not a smaller one.
 */
export function CraftSection({
  panels,
  as: Heading = "h2",
  layout = "pinned",
}: {
  panels: CraftPanel[];
  as?: "h1" | "h2";
  /**
   * `pinned` is the homepage's horizontal traverse. `stacked` is the same
   * content composed as a normal editorial column — used by the Craft page,
   * which should read as a page rather than as a second homepage.
   */
  layout?: "pinned" | "stacked";
}) {
  const wrapRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const narrow = useMediaQuery("(max-width: 900px)");
  const unpinned = layout === "stacked" || narrow;

  useScrollEffect(
    (vh) => {
      const wrap = wrapRef.current;
      if (!wrap || unpinned) return;

      const p = sectionProgress(wrap, vh);
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${-p * 200}vw)`;
      }
      if (railRef.current) railRef.current.style.transform = `scaleX(${p})`;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      wrap
        .querySelectorAll<HTMLElement>("[data-p1-craft-img]")
        .forEach((image, i) => {
          const local = Math.max(-1, Math.min(1, p * 2 - i));
          image.style.transform =
            `scale(${(1.16 - Math.abs(local) * 0.06).toFixed(3)})` +
            ` translateX(${(local * -5).toFixed(2)}%)`;
        });
    },
    [unpinned],
  );

  return (
    <section
      id="craft"
      ref={wrapRef}
      aria-labelledby="craft-heading"
      className="relative border-t border-hairline"
      style={{ height: unpinned ? "auto" : "240vh" }}
    >
      <div
        style={{
          position: unpinned ? "static" : "sticky",
          top: 0,
          height: unpinned ? "auto" : "100vh",
          overflow: unpinned ? "visible" : "hidden",
        }}
      >
        <div
          className="gutter-x z-[3] lg:absolute lg:left-[var(--gutter)] lg:top-24 lg:px-0"
          style={{ paddingTop: unpinned ? 80 : 0 }}
        >
          <div className="p1-eyebrow mb-4">[ 05 — Craft ]</div>
          <Heading id="craft-heading" className="p1-h4">
            Imported precision. In-house backbone.
          </Heading>
        </div>

        <div
          ref={trackRef}
          className="flex"
          style={{
            flexDirection: unpinned ? "column" : "row",
            width: unpinned ? "100%" : "300vw",
            height: unpinned ? "auto" : "100%",
            willChange: "transform",
          }}
        >
          {panels.map((panel) => (
            <div
              key={panel.num}
              className="grid flex-none items-center gutter-x"
              style={{
                width: unpinned ? "100%" : "100vw",
                height: unpinned ? "auto" : "100%",
                gridTemplateColumns: unpinned ? "1fr" : "1fr 1fr",
                gap: unpinned ? "32px" : "80px",
                paddingTop: unpinned ? 56 : 200,
                paddingBottom: unpinned ? 56 : 96,
              }}
            >
              <div
                className="relative aspect-[4/3] overflow-hidden border border-hairline bg-panel"
                style={{ order: unpinned ? 0 : panel.imageFirst ? 1 : 2 }}
              >
                <div
                  data-p1-craft-img=""
                  className="absolute inset-0"
                  style={{ transform: "scale(1.14)", willChange: "transform" }}
                >
                  {panel.image ? (
                    <Media
                      src={panel.image.src}
                      alt={panel.image.alt || panel.title}
                      sizes="(max-width: 900px) 100vw, 50vw"
                    />
                  ) : null}
                </div>
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg,transparent 55%,rgba(13,13,15,.5))",
                  }}
                />
              </div>

              <div style={{ order: unpinned ? 1 : panel.imageFirst ? 2 : 1 }}>
                <div className="p1-mono mb-5 text-soft">
                  {panel.num}
                </div>
                <h3 className="p1-h2">{panel.title}</h3>
                <p className="p1-lead mt-7 max-w-[46ch]">{panel.body}</p>
              </div>
            </div>
          ))}
        </div>

        {!unpinned ? (
          <div
            aria-hidden="true"
            className="absolute bottom-12 left-[var(--gutter)] right-[var(--gutter)] h-px bg-hairline"
          >
            <div
              ref={railRef}
              className="h-px origin-left scale-x-0 bg-signal"
              style={{ willChange: "transform" }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
