"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Media } from "@/components/ui/Media";
import type { ChainNode } from "@/lib/content/sections";
import { sectionProgress, useMediaQuery, useScrollEffect } from "@/lib/motion";

/**
 * "The chain" — source to subwoofer as one system.
 *
 * Scrolling drives a signal pulse along the rail; each pillar lights up as
 * the pulse reaches it and the stage crossfades to that product. Any pillar
 * can be pinned to hold it, which is also how the section is operated by
 * keyboard and on touch.
 *
 * Un-pins below 1024px or under 720px tall — the spec column has a real
 * min-content height it cannot give back.
 */
export function ChainSection({ nodes }: { nodes: ChainNode[] }) {
  const wrapRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState<number | null>(null);

  const unpinned = useMediaQuery(
    "(max-width: 1024px), (max-height: 719px)",
  );

  useScrollEffect(
    (vh) => {
      const wrap = wrapRef.current;
      if (!wrap || unpinned) return;

      const p = sectionProgress(wrap, vh);
      const rail = railRef.current;
      if (rail) rail.style.transform = `scaleX(${p})`;
      if (pulseRef.current) {
        pulseRef.current.style.opacity = p > 0.001 && p < 0.999 ? "1" : "0";
        pulseRef.current.style.transform = `translateX(${p * (rail?.offsetWidth ?? 0)}px)`;
      }
      if (percentRef.current) {
        percentRef.current.textContent = `${String(Math.round(p * 100)).padStart(2, "0")}%`;
      }

      let lit = 0;
      const nodeEls =
        nodesRef.current?.querySelectorAll<HTMLElement>("[data-p1-node]");
      nodeEls?.forEach((node, i) => {
        const threshold = (i + 0.5) / nodes.length;
        const isLit = p >= threshold - 0.06;
        if (isLit) lit = i;

        node.style.opacity =
          pinned === null ? "1" : pinned === i ? "1" : "0.3";

        const button = node.querySelector("button");
        if (button) {
          button.style.borderColor =
            isLit || pinned === i ? "var(--signal)" : "rgba(230,230,230,0.10)";
          button.style.backgroundColor =
            pinned === i ? "var(--surface-raised)" : "var(--surface-panel)";
        }

        node
          .querySelectorAll<HTMLElement>("[data-p1-vu]")
          .forEach((bar, j) => {
            const level = isLit
              ? 0.25 + ((Math.sin(i * 2.3 + j * 1.7) + 1) / 2) * 0.75
              : 0.12;
            bar.style.transform = `scaleY(${level})`;
            // Set imperatively per frame, so the unlit colour is resolved
            // against the active theme rather than baked dark.
            bar.style.backgroundColor = isLit
              ? "var(--signal)"
              : "var(--hairline-strong)";
          });
      });

      const next = pinned ?? lit;

      // Scrub the stage image itself so it drifts inside its own segment.
      const segment = 1 / Math.max(1, nodes.length);
      stageRef.current
        ?.querySelectorAll<HTMLElement>("[data-p1-stage-img]")
        .forEach((image, i) => {
          const on = i === next;
          image.style.opacity = on ? "1" : "0";
          const local = Math.max(
            0,
            Math.min(1, (p - i * segment) / segment),
          );
          image.style.transform = on
            ? `scale(${(1.02 - local * 0.06).toFixed(3)}) translateY(${((0.5 - local) * 22).toFixed(1)}px)`
            : "scale(1.08)";
        });

      if (next !== active) setActive(next);
    },
    [unpinned, pinned, active, nodes.length],
  );

  const node = nodes[active] ?? nodes[0];
  if (!node) return null;

  const togglePin = (index: number) =>
    setPinned((current) => {
      const next = current === index ? null : index;
      setActive(next ?? index);
      return next;
    });

  return (
    <section
      id="chain"
      ref={wrapRef}
      aria-labelledby="chain-heading"
      className="relative border-t border-hairline"
      style={{ height: unpinned ? "auto" : "360vh" }}
    >
      <div
        className="flex flex-col gutter-x"
        style={{
          position: unpinned ? "static" : "sticky",
          top: 0,
          height: unpinned ? "auto" : "100vh",
          overflow: unpinned ? "visible" : "hidden",
          paddingTop: unpinned ? 80 : 88,
          paddingBottom: unpinned ? 80 : 40,
        }}
      >
        <div className="p1-shell relative z-[2] flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-baseline justify-between gap-8">
            <div>
              <div className="p1-eyebrow mb-6">[ 03 — The chain ]</div>
              <h2 id="chain-heading" className="p1-h2">
                Source to subwoofer. One system.
              </h2>
            </div>
            <p className="m-0 max-w-[34ch] text-base leading-[1.6] text-muted">
              Seven pillars of the PRO1st line, engineered to interlock.
            </p>
          </div>

          <div className="relative mt-10 flex-none">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-11 h-px bg-hairline"
            />
            <div
              ref={railRef}
              aria-hidden="true"
              className="absolute inset-x-0 top-11 h-px origin-left scale-x-0 bg-signal"
              style={{ willChange: "transform" }}
            />
            <div
              ref={pulseRef}
              aria-hidden="true"
              className="absolute left-0 top-[41px] h-[7px] w-[7px] rounded-full bg-signal opacity-0"
              style={{ boxShadow: "0 0 14px 3px var(--sig-40)" }}
            />

            <div
              ref={nodesRef}
              className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
            >
              {nodes.map((item, index) => (
                <div
                  key={item.label}
                  data-p1-node=""
                  className="flex flex-col transition-opacity duration-[420ms] ease-signal"
                >
                  <button
                    type="button"
                    onClick={() => togglePin(index)}
                    aria-pressed={pinned === index}
                    className="flex cursor-pointer flex-col gap-3 border border-hairline bg-panel px-3.5 pb-3 pt-3.5 text-left transition-[border-color,background-color] duration-[420ms] ease-signal hover:bg-steel"
                  >
                    <span className="p1-mono flex justify-between gap-2 text-muted">
                      <span>{item.label}</span>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex h-[26px] items-end gap-[3px]"
                    >
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span
                          key={j}
                          data-p1-vu=""
                          className="h-full flex-1 origin-bottom bg-[rgba(230,230,230,0.18)] transition-[transform,background-color] duration-[620ms] ease-signal"
                          style={{ transform: "scaleY(0.12)" }}
                        />
                      ))}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-11 grid min-h-0 flex-1 items-center gap-8 lg:grid-cols-[7fr_5fr] lg:gap-16"
            style={{ flex: unpinned ? "none" : 1 }}
          >
            <div
              ref={stageRef}
              className="relative min-h-0 overflow-hidden border border-hairline bg-panel"
              style={{
                height: unpinned ? "auto" : "100%",
                aspectRatio: unpinned ? "16 / 10" : "auto",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 62%, var(--sig-12), transparent 60%)",
                }}
              />
              {nodes.map((item, index) => (
                <div
                  key={item.label}
                  data-p1-stage-img=""
                  className="absolute inset-0 transition-[opacity,transform] duration-[620ms] ease-signal"
                  style={{
                    opacity: unpinned ? (index === active ? 1 : 0) : 0,
                    willChange: "transform, opacity",
                  }}
                >
                  {item.image ? (
                    <Media
                      src={item.image.src}
                      alt={item.image.alt || item.product}
                      fit="contain"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="p-9"
                    />
                  ) : null}
                </div>
              ))}
              <div
                aria-hidden="true"
                className="p1-mono absolute left-5 top-5 text-faint"
              >
                Signal in <span ref={percentRef} className="text-signal">00%</span>{" "}
                Air out
              </div>
              <div
                aria-hidden="true"
                className="absolute bottom-[18px] right-5 font-display text-[64px] font-bold leading-none tracking-[-0.04em] text-[rgba(230,230,230,0.09)]"
              >
                {String(active + 1).padStart(2, "0")}
              </div>
            </div>

            <div
              aria-live="polite"
              className="flex min-h-0 flex-col justify-center"
            >
              <div className="p1-eyebrow mb-5">{node.label}</div>
              <h3 className="p1-h3">{node.product}</h3>
              <div className="p1-mono mt-5 text-muted">
                {node.spec}
              </div>
              <div className="mt-7 flex items-baseline gap-5 border-t border-hairline pt-6">
                <span className="font-display text-[26px] font-medium text-signal">
                  {node.price}
                </span>
                <Link href={`/products/${node.handle}`} className="p1-link">
                  View product →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
