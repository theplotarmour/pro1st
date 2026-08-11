"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChassisShell } from "@/components/hero/ChassisShell";
import { buildCopy } from "@/data/editorial";
import { explodeOffsets } from "@/data/site";
import type { BuildUnit } from "@/lib/content/sections";
import { clamp01, inOutCubic, outCubic } from "@/lib/format";
import { sectionProgress, useMediaQuery, useScrollEffect } from "@/lib/motion";

const STAGE_W = 660;
const STAGE_H = 400;
const DEPTH = 112;
const SLICES = 8;

/**
 * "The build" — the MX-1600 assembles itself out of eight exploded layers,
 * revolves once, and locks with its callouts.
 *
 * Every value is a pure function of scroll progress, so the animation is
 * fully scrubbable in both directions and never drifts out of sync.
 *
 * Below 900px the section un-pins entirely: a tall pinned 3D stage is the
 * wrong composition for a phone, so the chassis is shown assembled and the
 * copy reads as a normal block.
 */
export function BuildSection({ unit }: { unit: BuildUnit }) {
  const wrapRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const calloutsRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);

  const unpinned = useMediaQuery("(max-width: 900px)");

  useScrollEffect(
    (vh, vw) => {
      const wrap = wrapRef.current;
      const stage = stageRef.current;
      if (!wrap || !stage) return;

      if (unpinned) {
        stage.style.transform = `scale(${Math.min(1, (vw - 96) / 700).toFixed(3)})`;
        wrap
          .querySelectorAll<HTMLElement>("[data-p1-slice]")
          .forEach((slice) => {
            slice.style.transform = "none";
            slice.style.opacity = "1";
          });
        wrap
          .querySelectorAll<HTMLElement>("[data-p1-face]")
          .forEach((face) => {
            face.style.opacity = "1";
          });
        if (calloutsRef.current) calloutsRef.current.style.opacity = "0";
        return;
      }

      const p = sectionProgress(wrap, vh);

      // A: 0.00–0.42 assemble · B: 0.42–0.86 traverse + revolve · C: 0.86–1 lock
      const tA = clamp01(p / 0.42);
      const tB = clamp01((p - 0.42) / 0.44);
      const tC = clamp01((p - 0.86) / 0.14);

      wrap
        .querySelectorAll<HTMLElement>("[data-p1-slice]")
        .forEach((slice) => {
          const i = Number(slice.dataset.i ?? 0);
          const offset = explodeOffsets[i];
          if (!offset) return;
          const local = outCubic(
            clamp01((tA - i * 0.045) / (1 - (SLICES - 1) * 0.045)),
          );
          const k = 1 - local;
          slice.style.transform =
            `translate3d(${(offset.x * k).toFixed(1)}px,${(offset.y * k).toFixed(1)}px,${(offset.z * k).toFixed(1)}px)` +
            ` rotate(${(offset.r * k).toFixed(2)}deg)`;
          slice.style.opacity = String(0.35 + local * 0.65);
        });

      wrap.querySelectorAll<HTMLElement>("[data-p1-face]").forEach((face) => {
        face.style.opacity = String(clamp01((tA - 0.72) / 0.28));
      });

      const plate = wrap.querySelector<HTMLElement>("[data-p1-plate]");
      if (plate) {
        plate.style.opacity = String(
          clamp01((tA - 0.86) / 0.14) * (1 - tB * 0.6),
        );
      }

      // Fit the 660×400 chassis into whatever the pinned frame leaves us.
      const availableW = Math.min(vw * 0.62, vw - 220);
      const availableH = vh - 340;
      const fit = Math.max(
        0.42,
        Math.min(1, availableW / 700, availableH / 430),
      );

      const x = (-30 + inOutCubic(tB) * 58) * (vw / 100);
      const rotY = inOutCubic(tB) * 360;
      const rotX = Math.sin(tB * Math.PI) * -9;
      const scale =
        (0.86 + tA * 0.14 + Math.sin(tB * Math.PI) * 0.06 + tC * 0.05) * fit;
      stage.style.transform =
        `translateX(${x.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg)` +
        ` rotateX(${rotX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

      if (calloutsRef.current) calloutsRef.current.style.opacity = String(tC);
      if (railRef.current) railRef.current.style.transform = `scaleX(${p})`;
      if (bloomRef.current) {
        bloomRef.current.style.opacity = String(
          Math.max(clamp01((tA - 0.9) / 0.1) * 0.5, tC * 0.7),
        );
      }
      if (phaseRef.current) {
        const label =
          tB <= 0
            ? `Assembly — ${Math.round(tA * 100)}%`
            : tC <= 0
              ? `Revolution — ${Math.round(tB * 100)}%`
              : "Chassis locked";
        if (phaseRef.current.textContent !== label) {
          phaseRef.current.textContent = label;
        }
      }
    },
    [unpinned],
  );

  return (
    <section
      id="build"
      ref={wrapRef}
      aria-labelledby="build-heading"
      className="relative border-t border-hairline"
      style={{ height: unpinned ? "auto" : "620vh" }}
    >
      <div
        ref={stickyRef}
        className="flex flex-col gutter-x"
        style={{
          position: unpinned ? "static" : "sticky",
          top: 0,
          height: unpinned ? "auto" : "100vh",
          minHeight: unpinned ? 520 : 0,
          overflow: unpinned ? "visible" : "hidden",
          paddingTop: unpinned ? 80 : 88,
          paddingBottom: unpinned ? 80 : 40,
        }}
      >
        <div
          ref={bloomRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 52%, var(--sig-24), transparent 58%)",
          }}
        />

        <div className="relative z-[3] flex flex-none flex-wrap items-baseline justify-between gap-8">
          <div>
            <div className="p1-eyebrow mb-5">{buildCopy.eyebrow}</div>
            <h2 id="build-heading" className="p1-h2">
              {buildCopy.heading}
            </h2>
          </div>
          <p className="m-0 max-w-[32ch] text-base leading-[1.6] text-muted">
            {buildCopy.lead}
          </p>
        </div>

        <div
          className="relative min-h-0 flex-1"
          style={{
            perspective: 1700,
            perspectiveOrigin: "50% 46%",
            minHeight: unpinned ? 420 : 0,
          }}
        >
          <div
            ref={stageRef}
            className="absolute left-1/2 top-1/2"
            style={{
              width: STAGE_W,
              height: STAGE_H,
              margin: `${-STAGE_H / 2}px 0 0 ${-STAGE_W / 2}px`,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >
            <ChassisShell
              width={STAGE_W}
              height={STAGE_H}
              depth={DEPTH}
              faceAttr="face"
              gridSize={44}
            />

            <div
              className="absolute inset-0"
              style={{
                transform: `translateZ(${DEPTH / 2}px)`,
                transformStyle: "preserve-3d",
              }}
            >
              {Array.from({ length: SLICES }).map((_, i) => (
                <Image
                  key={i}
                  data-p1-slice=""
                  data-i={i}
                  src={unit.image?.src ?? ""}
                  alt={i === SLICES - 1 ? (unit.image?.alt ?? "") : ""}
                  aria-hidden={i !== SLICES - 1}
                  fill
                  sizes="660px"
                  priority={false}
                  className="object-cover"
                  style={{
                    clipPath: `inset(${i * 12.5}% 0 ${87.5 - i * 12.5}% 0)`,
                    willChange: "transform",
                  }}
                />
              ))}
              <div
                data-p1-plate=""
                aria-hidden="true"
                className="absolute inset-0 border border-sig-40 opacity-0"
              />
            </div>
          </div>

          <div
            ref={calloutsRef}
            aria-hidden="true"
            className="absolute inset-0 hidden opacity-0 transition-opacity duration-[420ms] ease-signal lg:block"
          >
            {buildCopy.callouts.map((callout) => (
              <div
                key={callout.text}
                className="absolute flex items-center gap-3.5"
                style={{
                  top: callout.top,
                  ...(callout.side === "left"
                    ? { left: "5%" }
                    : { right: "5%" }),
                }}
              >
                {callout.side === "right" ? (
                  <span
                    className="h-px bg-sig-40"
                    style={{ width: callout.rule }}
                  />
                ) : null}
                <span className="p1-mono whitespace-nowrap text-muted">
                  {callout.text}
                </span>
                {callout.side === "left" ? (
                  <span
                    className="h-px bg-sig-40"
                    style={{ width: callout.rule }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="p1-mono relative z-[3] flex flex-none items-end justify-between gap-6 text-[rgba(230,230,230,0.42)]">
          <span ref={phaseRef}>Assembly — 00%</span>
          <span className="text-muted">
            {unit.unit}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="relative z-[3] mt-3.5 h-px flex-none bg-hairline"
        >
          <div
            ref={railRef}
            className="h-px origin-left scale-x-0 bg-signal"
            style={{ willChange: "transform" }}
          />
        </div>
      </div>
    </section>
  );
}
