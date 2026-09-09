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
        forgetScrollOnReload(ScrollTrigger);
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

/**
 * Stop ScrollTrigger putting a reload back where it was.
 *
 * ScrollTrigger keeps its own record of the scroll position and restores it
 * when the page loads. That is separate from `history.scrollRestoration`, so
 * the head script in `layout.tsx` — which switches the browser's own
 * restoration off for a reload — has no effect on it, and the two together
 * are why a reload landed at 396px rather than the top: the browser stayed
 * where it was told, and ScrollTrigger scrolled afterwards, clamped by a
 * document that was still streaming.
 *
 * Cleared on reload only, matching the head script. A back or forward
 * navigation keeps ScrollTrigger's memory, which is the case the feature
 * exists for.
 *
 * Runs once per document; every `useGsapContext` on the page reaches this,
 * and clearing the memory repeatedly would fight any scrolling the reader
 * has already done.
 */
let scrollMemoryCleared = false;

function forgetScrollOnReload(ScrollTrigger: {
  clearScrollMemory: (restoration?: string) => void;
}): void {
  if (scrollMemoryCleared) return;
  scrollMemoryCleared = true;

  const entry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (entry?.type !== "reload") return;

  ScrollTrigger.clearScrollMemory();

  // Only take the page to the top when nothing else has a claim on where it
  // should be. With a hash, `AnchorScroll` owns the destination and a
  // competing scroll here would be one more thing for it to undo.
  if (!window.location.hash) window.scrollTo(0, 0);
}
