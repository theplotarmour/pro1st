"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * GSAP, loaded on demand and only when motion is wanted.
 *
 * GSAP and ScrollTrigger are ~50kB together. Nothing above the fold needs
 * them, and under `prefers-reduced-motion` nothing needs them at all, so they
 * are imported inside the effect rather than at module scope — a page that
 * never scrolls into a GSAP section never pays for one.
 *
 * `useGsapContext` gives each component a `gsap.Context` scoped to its own
 * element. Context.revert() on unmount undoes every tween and ScrollTrigger
 * the callback created and restores the inline styles it overwrote, which is
 * what keeps App Router navigations from leaving dead triggers behind.
 */
export function useGsapContext<T extends HTMLElement>(
  setup: (
    gsap: typeof import("gsap").gsap,
    scope: T,
  ) => void | (() => void),
  deps: unknown[] = [],
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const scope = ref.current;
    if (!scope) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let context: { revert: () => void } | null = null;
    let cancelled = false;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        context = gsap.context(() => setup(gsap, scope), scope);
      },
    );

    return () => {
      cancelled = true;
      context?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
