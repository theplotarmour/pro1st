"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Makes in-page anchors land on their target.
 *
 * The browser scrolls to a hash once, while parsing. On this site the anchors
 * sit below product imagery that has no resolved size at that moment, so
 * everything beneath it moves once the images arrive and the page ends up
 * back at the top — /contact#faq from the navigation landed nowhere near the
 * FAQ. Scrolling again on `load`, after layout has settled, is the whole fix.
 *
 * Deliberately native: `behavior: "instant"`, no smooth-scroll library and no
 * easing. Scrolling on this site should feel exactly like scrolling on any
 * other, and the only job here is to arrive at the right place.
 */
export function AnchorScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.length < 2) return;

    let target: HTMLElement | null = null;
    try {
      target = document.querySelector<HTMLElement>(hash);
    } catch {
      // A hash that is not a valid selector is just a fragment we don't own.
      return;
    }
    if (!target) return;

    const go = () =>
      target?.scrollIntoView({ behavior: "instant", block: "start" });

    /*
      Re-aim whenever the page changes height, rather than at guessed times.

      Two things move the target after this effect runs: the router performs
      its own scroll to the top as part of rendering the route, and every
      image above the anchor resolves its size late, pushing the anchor down.
      Fixed delays were tried and lost both races — a 250ms attempt was
      undone by the router, and a `load` attempt still landed 562px short
      because the map below kept growing.

      Watching `documentElement` catches all of it: any reflow that could have
      moved the target re-runs the scroll. It stops after two seconds, or the
      moment the reader takes over.
    */
    /*
      Both mechanisms are needed, and neither is sufficient alone.

      Timed retries win the race against the router, which scrolls the route
      to the top after this effect runs and produces no reflow for an observer
      to notice. The height observer catches the images above the anchor
      resolving late, which happens well after any fixed delay worth waiting.
      Tried separately, the first landed at 0 and the second landed 562px
      short.
    */
    go();
    const frame = requestAnimationFrame(go);
    const retries = [80, 250, 600].map((delay) =>
      window.setTimeout(go, delay),
    );
    window.addEventListener("load", go);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      for (const id of retries) window.clearTimeout(id);
      window.clearTimeout(timer);
      window.removeEventListener("load", go);
      window.removeEventListener("wheel", finish);
      window.removeEventListener("touchstart", finish);
      window.removeEventListener("keydown", finish);
    };

    const observer = new ResizeObserver(() => {
      if (!done) go();
    });
    observer.observe(document.documentElement);

    const timer = window.setTimeout(finish, 2000);
    // The reader's own scroll always wins over ours.
    window.addEventListener("wheel", finish, { passive: true, once: true });
    window.addEventListener("touchstart", finish, { passive: true, once: true });
    window.addEventListener("keydown", finish, { once: true });

    return finish;
  }, [pathname]);

  return null;
}
