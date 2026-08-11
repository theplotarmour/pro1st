"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** Live `prefers-reduced-motion` state. Every effect below respects it. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return reduced;
}

/** True once the viewport is at or above `query`. SSR-safe (false first). */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const apply = () => setMatch(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [query]);

  return match;
}

export interface ScrollState {
  /** window.scrollY */
  y: number;
  /** Signed scroll delta of the last frame, decayed toward 0. */
  velocity: number;
  vh: number;
  vw: number;
}

/**
 * A single shared scroll/resize listener feeding a mutable ref.
 *
 * Effects read the ref inside their own rAF loop rather than re-rendering —
 * the design's motion is scrubbed, and React state per scroll event would
 * cost far more than it buys.
 */
export function useScrollState(): RefObject<ScrollState> {
  const state = useRef<ScrollState>({ y: 0, velocity: 0, vh: 0, vw: 0 });

  useEffect(() => {
    let last = window.scrollY;
    const readViewport = () => {
      state.current.vh = window.innerHeight;
      state.current.vw = window.innerWidth;
    };
    const onScroll = () => {
      const y = window.scrollY;
      state.current.velocity += y - last;
      state.current.y = y;
      last = y;
    };

    readViewport();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", readViewport, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", readViewport);
    };
  }, []);

  return state;
}

/**
 * rAF loop that stays mounted for the component's lifetime.
 * `active: false` tears the loop down entirely rather than idling in it.
 */
export function useAnimationFrame(
  callback: (time: number) => void,
  active = true,
): void {
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);
      saved.current(time);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active]);
}

/**
 * Scroll progress through a tall pinned section: 0 when its top hits the
 * viewport top, 1 when its bottom does.
 */
export function sectionProgress(el: HTMLElement, vh: number): number {
  const rect = el.getBoundingClientRect();
  const travel = el.offsetHeight - vh;
  if (travel <= 0) return 0;
  const p = -rect.top / travel;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

/**
 * Runs `effect` on scroll and resize, rAF-coalesced. Used by every scrubbed
 * section so the page has one write pass per frame, not one per section.
 */
export function useScrollEffect(
  effect: (vh: number, vw: number) => void,
  deps: unknown[] = [],
): void {
  const saved = useRef(effect);
  saved.current = effect;

  useEffect(() => {
    let queued = false;
    const run = () => {
      queued = false;
      saved.current(window.innerHeight, window.innerWidth);
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    };

    run();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
