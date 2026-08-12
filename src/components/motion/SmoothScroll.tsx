"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  /** Set by popstate, so a back/forward restore is not overridden. */
  const restoringRef = useRef(false);

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

    lenisRef.current = lenis;

    const onPopState = () => {
      restoringRef.current = true;
    };
    window.addEventListener("popstate", onPopState);

    /*
      One clock, not two.

      Lenis ran its own requestAnimationFrame loop and GSAP ran its ticker
      independently. Two loops sampling the same scroll on their own schedules
      means the scrubbed hero animation is a frame ahead or behind the page it
      is supposed to be locked to, which is what reads as jitter — the page
      moves smoothly, the thing pinned to it does not.

      Driving `lenis.raf` from GSAP's ticker puts the scroll position and
      everything keyed to it on the same frame. `lagSmoothing(0)` stops GSAP
      compensating for a slow frame by fabricating time, which on a weak
      device turns one dropped frame into a visible skip.
    */
    let frame = 0;
    let scrollTriggerUpdate: (() => void) | null = null;
    let detachTicker: (() => void) | null = null;

    let cancelled = false;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) {
          lenis.destroy();
          return;
        }
        gsap.registerPlugin(ScrollTrigger);

        scrollTriggerUpdate = () => ScrollTrigger.update();
        lenis.on("scroll", scrollTriggerUpdate);

        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        detachTicker = () => gsap.ticker.remove(tick);

        ScrollTrigger.refresh();
      },
    );

    // Until GSAP lands, Lenis still needs a clock of its own — otherwise the
    // page cannot be scrolled at all for the first few hundred milliseconds.
    const bootstrap = (time: number) => {
      if (detachTicker) return;
      lenis.raf(time);
      frame = requestAnimationFrame(bootstrap);
    };
    frame = requestAnimationFrame(bootstrap);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("popstate", onPopState);
      if (scrollTriggerUpdate) lenis.off("scroll", scrollTriggerUpdate);
      detachTicker?.();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  /*
    Land at the top of a new route.

    Next scrolls the window to 0 on navigation, but Lenis keeps its own
    `animatedScroll` and writes it back on the next frame — so the browser
    goes to the top and Lenis immediately drags it back to wherever the
    previous page was left. That is why opening a product from halfway down
    the catalogue dropped you into the middle of the product page.

    `scrollTo(..., { immediate: true })` moves Lenis' internal position too,
    which a bare `window.scrollTo` does not.
  */
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    /*
      A back/forward restore is the browser's to decide. Lenis only has to
      stop overwriting it.

      Adopting the position once, on the next frame, is too early: the router
      restores after its own render, so a single sync pins Lenis to 0 and it
      then fights the restore back to the top. Instead Lenis is pinned to
      wherever the page currently is, every frame, for half a second — it
      never drives, so whatever the router settles on is adopted.
    */
    if (restoringRef.current) {
      restoringRef.current = false;
      const until = performance.now() + 600;
      let raf = 0;
      const adopt = () => {
        lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        if (performance.now() < until) raf = requestAnimationFrame(adopt);
      };
      raf = requestAnimationFrame(adopt);
      return () => cancelAnimationFrame(raf);
    }

    // An in-page anchor has its own destination.
    const hash = window.location.hash;
    if (hash.length > 1) {
      const target = document.querySelector<HTMLElement>(hash);
      if (target) {
        /*
          Twice: now, and again once the page has finished loading.

          On a cold load the anchor's final position is not known yet — the
          images above it have no intrinsic size resolved, so everything below
          them moves once they arrive. Scrolling only on mount lands short, or
          at zero.
        */
        const go = () => lenis.scrollTo(target, { immediate: true });
        go();
        if (document.readyState === "complete") return;
        window.addEventListener("load", go, { once: true });
        return () => window.removeEventListener("load", go);
      }
    }

    lenis.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
