"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Lenis smooth scroll, and the single place GSAP's ScrollTrigger is wired to
 * it.
 *
 * Lenis animates the real document scroll position rather than transforming a
 * fake wrapper, so `window.scrollY` and native `scroll` events stay truthful.
 * That matters here: every scrubbed section in this codebase already reads
 * scroll through `useScrollEffect`, and none of them need to change.
 *
 * Three things this deliberately does NOT do:
 *
 *   1. It does not run under `prefers-reduced-motion`. Smooth scrolling is
 *      exactly the kind of motion that setting exists to switch off, and
 *      easing someone's scroll against their stated preference is worse than
 *      having no effect at all.
 *
 *   2. It does not hijack anchor links. `lerp` eases the wheel; in-page jumps
 *      still land immediately, so "Support & FAQ" reaching /contact#faq is
 *      not turned into a two-second ride.
 *
 *   3. It does not touch touch devices' native scrolling. `smoothWheel` only
 *      applies to wheel and trackpad input; on a phone the OS scroller stays
 *      in charge, which is what makes it feel native.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      // ~0.9s to settle. Long enough to read as weight, short enough that the
      // page still feels attached to the wheel.
      lerp: 0.11,
      wheelMultiplier: 1,
      smoothWheel: true,
      // The OS scroller is better than anything we can emulate here.
      syncTouch: false,
    });

    let frame = 0;
    let scrollTriggerUpdate: (() => void) | null = null;

    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // ScrollTrigger has to be told when Lenis moves the page, or it samples
    // scroll on its own schedule and every scrubbed animation lags the scroll
    // by a frame or two. Imported lazily so GSAP stays out of the bundle for
    // anyone who never scrolls a page that uses it.
    let cancelled = false;
    void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (cancelled) return;
      scrollTriggerUpdate = () => ScrollTrigger.update();
      lenis.on("scroll", scrollTriggerUpdate);
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (scrollTriggerUpdate) lenis.off("scroll", scrollTriggerUpdate);
      lenis.destroy();
    };
  }, []);

  return null;
}
