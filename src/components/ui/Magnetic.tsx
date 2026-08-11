"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Pointer-magnetism for primary CTAs — the button leans toward the cursor by
 * at most 8px. Fine pointers only, and never under reduced motion.
 */
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrapper = ref.current;
    const el = wrapper?.firstElementChild as HTMLElement | null;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer:fine)").matches) return;

    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      if (Math.hypot(dx, dy) >= rect.width / 2 + 60) return;
      el.style.transition = "transform 120ms linear, letter-spacing 120ms";
      el.style.transform = `translate(${Math.max(-8, Math.min(8, dx * 0.25))}px,${Math.max(-8, Math.min(8, dy * 0.35))}px)`;
    };

    const onLeave = () => {
      el.style.transition = "transform 420ms var(--e-signal)";
      el.style.transform = "none";
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <span ref={ref} className="contents">
      {children}
    </span>
  );
}
