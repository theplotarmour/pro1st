"use client";

import { useEffect, useRef } from "react";
import { Media } from "@/components/ui/Media";
import { useAnimationFrame, useScrollEffect } from "@/lib/motion";
import { ChassisShell } from "./ChassisShell";

const WIDTH = 440;
const HEIGHT = 300;
const DEPTH = 78;

/**
 * The hero unit: a slowly revolving AJ6 chassis that drifts up and dims as
 * the page scrolls past it. Hidden below 980px, where the headline needs
 * the whole screen.
 */
export function HeroChassis({ image, alt }: { image: string; alt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useRef(0);
  const fit = useRef(1);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (wrap) wrap.style.opacity = "1";
  }, []);

  useScrollEffect((vh, vw) => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    fit.current = Math.max(
      0.6,
      Math.min(1, (vw - 720) / 520, (vh - 300) / 340),
    );

    const p = Math.min(1, window.scrollY / vh);
    scrollProgress.current = p;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    wrap.style.opacity = String(Math.max(0, 1 - p * 1.6));
    wrap.style.transform = reduced
      ? `scale(${fit.current})`
      : `translateY(${(p * -140).toFixed(1)}px) scale(${fit.current * (1 - p * 0.12)})`;
  });

  useAnimationFrame((time) => {
    const box = boxRef.current;
    if (!box) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const p = scrollProgress.current;
    const rotY = (time * 0.014 + p * 150) % 360;
    const rotX = Math.sin(time * 0.00042) * 7 - 4 + p * 10;
    box.style.transform = `rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;
  });

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-[4%] right-2 z-[1] hidden h-[320px] w-[460px] opacity-0 min-[980px]:block xl:right-[calc(var(--gutter)-48px)]"
      style={{ perspective: 1500, willChange: "transform" }}
    >
      <div
        className="absolute"
        style={{
          inset: "-14% -10%",
          background:
            "radial-gradient(ellipse at 50% 50%, var(--sig-12), transparent 62%)",
        }}
      />
      <div
        ref={boxRef}
        className="absolute left-1/2 top-1/2"
        style={{
          width: WIDTH,
          height: HEIGHT,
          margin: `${-HEIGHT / 2}px 0 0 ${-WIDTH / 2}px`,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <ChassisShell width={WIDTH} height={HEIGHT} depth={DEPTH} />
        <div
          className="absolute inset-0 overflow-hidden border border-hairline"
          style={{
            transform: `translateZ(${DEPTH / 2}px)`,
            backfaceVisibility: "hidden",
          }}
        >
          <Media src={image} alt={alt} sizes="460px" priority />
        </div>
      </div>
    </div>
  );
}
