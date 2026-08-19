"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Which half of the clip the next click will run. */
type Phase = "explode" | "rebuild";

/**
 * The AJ6 in the hero: a product shot that comes apart when you click it, and
 * goes back together when you click it again.
 *
 * The clip revolves the mixer, then explodes it into its boards, chassis and
 * front panel. That is the argument the hero is making — engineered, not
 * assembled — shown rather than claimed, so it is worth a click. It is not
 * worth playing at someone unasked, so nothing autoplays.
 *
 * ## Forward and back, without ever playing backwards
 *
 * The asset is the explode followed by its own reverse, as one file. A click
 * on the assembled mixer plays the first half and stops on the exploded
 * frame; the next click plays the second half and stops on the assembled one.
 * Playback is therefore always forward at rate 1, which is the only thing
 * browsers do smoothly — negative `playbackRate` is unsupported, and scrubbing
 * `currentTime` backwards frame by frame stutters against the codec's
 * keyframes.
 *
 * Only the first half needs watching, since the second ends the file and the
 * element pauses itself. A rAF loop pauses on the midpoint and snaps
 * `currentTime` to it exactly, so repeated round trips cannot drift.
 *
 * ## The background is gone, not hidden
 *
 * The footage was shot on a black cyclorama. Dropping that rectangle onto the
 * page was never going to work: black-on-#0d0d0f is a 5/255 step, invisible
 * as a field but unmistakable as a straight edge, and over the waveform
 * ribbon it reads as a hole punched in the light. So the background is cut out
 * of the asset itself and the clip ships with an alpha channel.
 *
 * Getting that matte right took two rules rather than one, and both matter —
 * `scripts/matte-video.py` carries the full reasoning. In short: connectivity
 * decides the interior, because the AJ6's own faceplate and knobs are black
 * and any brightness threshold hollows them out; and a luma ramp decides the
 * transition, because the chassis front lip fades continuously into the
 * backdrop and a binary matte bit the entire lip off the mixer.
 *
 * ## Codecs
 *
 * Alpha video has no single universal format, and no API reports whether a
 * decoder honours an alpha channel — `canPlayType` answers for the codec, not
 * the channel. So the source is chosen at runtime:
 *
 *   - VP9-in-WebM for Chrome, Firefox and Edge. Verified transparent.
 *   - HEVC-in-MP4 for Safari, which is the format WebKit carries alpha in.
 *     Safari can decode VP9/WebM but drops the alpha, so it cannot simply be
 *     handed the first file.
 *   - A plain H.264 cut last, for anything that can play neither. That one
 *     keeps its black background — hence the edge feather below, which costs
 *     nothing when the alpha versions load and saves the layout when they do
 *     not.
 *
 * Picking by UA is the unpleasant part, and it is deliberate: capability
 * detection cannot answer this question.
 *
 * ## Loading
 *
 * `preload="metadata"`, not `none` or `auto`. The poster is a ~90kB
 * transparent still and the clip is ~2.6MB, so eagerly fetching the whole
 * thing would put it on the hero's critical path for the majority who never
 * click it. But `none` is too little on two counts: the phase logic needs
 * `duration` to know where the midpoint is, and in practice a `play()` call
 * against an element that has never fetched anything was observed leaving it
 * in the playing state with `readyState` 0 and no data ever arriving.
 * Metadata costs a header read and removes both problems.
 *
 * The body is warmed on pointer-enter, so on a mouse the file is usually
 * there before the click lands; on touch the click starts the fetch and
 * `playsInline` begins playback mid-download.
 *
 * The clip is silent — the audio track is stripped from the encode and the
 * element is muted regardless. With no control bar there would be no way to
 * turn sound off once it started.
 */
export function HeroProductVideo({ className = "" }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const warmed = useRef(false);
  /** Tears down the midpoint watcher; non-null only while it is armed. */
  const dispose = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<Phase>("explode");

  /*
    Source assignment is deferred to the client so the server and the first
    client render agree on the markup — the choice depends on the engine, and
    baking one in on the server would hydrate wrong half the time. The poster
    renders in the meantime, which is all this element shows until it is
    clicked anyway.
  */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const ua = navigator.userAgent;
    const isWebKit =
      /Safari/i.test(ua) && !/Chrome|Chromium|Android|CriOS|FxiOS|Edg/i.test(ua);

    const candidates = isWebKit
      ? ["/video/mixer-aj6-alpha.mp4", "/video/mixer-aj6.mp4"]
      : ["/video/mixer-aj6.webm", "/video/mixer-aj6.mp4"];

    const FALLBACK = "/video/mixer-aj6.mp4";

    video.src =
      candidates.find((src) =>
        video.canPlayType(
          src.endsWith(".webm")
            ? "video/webm; codecs=vp9"
            : src.includes("-alpha")
              ? 'video/mp4; codecs="hvc1"'
              : 'video/mp4; codecs="avc1.42E01E"',
        ) !== "",
      ) ?? FALLBACK;

    /*
      `canPlayType` is a guess — it answers "probably" at best, and it is
      answering about the codec while the thing that matters is the alpha
      channel. If the chosen file turns out not to decode, drop to the plain
      H.264 cut rather than leaving the hero with a dead frame. Its black
      background is the reason the mask below exists.
    */
    const onError = () => {
      if (video.src.endsWith(FALLBACK)) return;
      video.src = FALLBACK;
      video.load();
    };

    video.addEventListener("error", onError);
    return () => video.removeEventListener("error", onError);
  }, []);

  /**
   * Start the download before the click, when the pointer says one is coming.
   *
   * Raising `preload` is the whole of it — deliberately no `load()` call.
   * `load()` restarts the resource selection algorithm and aborts whatever is
   * in flight, and a real pointer fires `pointerenter` a few milliseconds
   * before `click`, so the reset lands on top of the `play()` that follows:
   * the element reports playing, emits an immediate `pause`, and sits at
   * `readyState` 0 with a frame that never arrives. Setting the attribute
   * asks the browser for the same data without tearing down the element that
   * is about to be played.
   */
  const warm = useCallback(() => {
    const video = videoRef.current;
    if (!video || warmed.current) return;
    warmed.current = true;
    video.preload = "auto";
  }, []);

  const clearWatch = useCallback(() => {
    dispose.current?.();
    dispose.current = null;
  }, []);

  /*
    Watch for the midpoint and stop there.

    Three signals, because no one of them is sufficient:

      - rAF is frame-accurate, and is suspended while the tab is in the
        background. Playback is not suspended, so on its own the clip runs
        straight past the midpoint and through the whole rebuild — which is
        exactly what happened before this was written.
      - `timeupdate` keeps firing in a background tab, but only about four
        times a second, so it can overshoot by ~250ms.
      - A timer armed for the remaining run gives a bound even if the element
        stops firing events.

    All three call the same check, and it snaps `currentTime` back to the
    midpoint, so whichever one wins the frame that lands is the right one.
  */
  const watchMidpoint = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    clearWatch();

    let raf: number | null = null;
    let timer: number | null = null;

    const check = () => {
      const half = video.duration / 2;
      if (!Number.isFinite(half) || video.currentTime < half - 0.02) return;

      video.pause();
      // Snap, so a hundred round trips cannot walk the midpoint forward.
      video.currentTime = half;
      setPhase("rebuild");
      clearWatch();
    };

    const loop = () => {
      if (video.paused) {
        clearWatch();
        return;
      }
      check();
      if (dispose.current) raf = requestAnimationFrame(loop);
    };

    video.addEventListener("timeupdate", check);
    raf = requestAnimationFrame(loop);

    const half = video.duration / 2;
    if (Number.isFinite(half)) {
      const remaining = Math.max(0, half - video.currentTime) * 1000;
      timer = window.setTimeout(check, remaining + 30);
    }

    dispose.current = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      if (timer !== null) clearTimeout(timer);
      video.removeEventListener("timeupdate", check);
    };
  }, [clearWatch]);

  useEffect(() => clearWatch, [clearWatch]);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
      clearWatch();
      return;
    }

    const duration = video.duration;
    const half = Number.isFinite(duration) ? duration / 2 : null;

    // Finished the rebuild: back to the top for another explode. The last
    // frame and the first frame are the same assembled pose, so the seek is
    // invisible.
    if (video.ended) {
      video.currentTime = 0;
      setPhase("explode");
      void video.play();
      watchMidpoint();
      return;
    }

    // Past the midpoint: run the rebuild, which ends the file on its own.
    if (half !== null && video.currentTime >= half - 0.02) {
      setPhase("explode");
      void video.play();
      return;
    }

    // Anywhere in the first half — including the very first click, where the
    // duration is not known yet because nothing has been fetched.
    setPhase("rebuild");
    void video.play();
    watchMidpoint();
  }, [clearWatch, watchMidpoint]);

  /*
    Stop when it leaves the screen. A hero is scrolled past within a second or
    two, and decoding frames for a section nobody is looking at is spent
    battery on a phone. Resuming is deliberately not automatic — playback was
    asked for once, and restarting it unprompted is the autoplay this avoids.

    `seen` guards the first callback. `observe()` always delivers one
    immediately and asynchronously, and if a click lands in that gap the
    entry — computed before the element settled — arrives after `play()` and
    pauses it about 20ms in. Requiring the element to have been visible once
    before it can be hidden makes the initial delivery inert.
  */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let seen = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          seen = true;
          return;
        }
        if (seen && !video.paused) video.pause();
      },
      { threshold: 0.15 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/*
        Nothing bright sits behind the mixer — no bloom layer here, and the
        waveform ribbon is faded out before this column (see `Hero`).

        Mid-explode the chassis opens and its interior is genuinely pure black
        and genuinely connected to the frame edge, so the matte cuts through
        it. That is not a fixable defect: there is no information in those
        pixels that distinguishes "inside the box" from "outside" it. What is
        fixable is what shows through. Against the page ground the gap reads
        as the shadowed inside of an opened chassis, which is what it is;
        against an orange bloom it read as a hole punched in the product.
      */}
      {/*
        The whole frame is the control — click anywhere on the mixer. It is a
        real <button> rather than a <video onClick> so that Tab reaches it,
        Enter and Space fire it, and it announces what the click will do
        instead of announcing itself as a video. There is no play glyph, by
        request; the label is what carries the affordance to anyone not using
        a pointer.
      */}
      <button
        type="button"
        onClick={toggle}
        onPointerEnter={warm}
        aria-label={
          phase === "explode"
            ? "Take the PRO1ST AJ6 apart"
            : "Put the PRO1ST AJ6 back together"
        }
        className="group block w-full cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-signal"
      >
        <video
          ref={videoRef}
          poster="/img/mixer-aj6-poster.webp"
          preload="metadata"
          muted
          playsInline
          disablePictureInPicture
          aria-hidden="true"
          onEnded={() => setPhase("explode")}
          // 16:9 is declared on the box so the row does not reflow when the
          // poster decodes.
          className="block aspect-[16/9] w-full object-contain"
          style={{
            /*
              Only does anything for the no-alpha fallback, where it softens
              the black frame edge into the page. Harmless on the alpha
              versions — it feathers a region that is already transparent.
            */
            maskImage:
              "linear-gradient(to right, transparent 0%, #000 4%, #000 96%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 4%, #000 96%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, #000 4%, #000 96%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 4%, #000 96%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />
      </button>
    </div>
  );
}
