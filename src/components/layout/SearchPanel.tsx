"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Media } from "@/components/ui/Media";
import type { SearchHit, SearchResponse } from "@/app/api/search/route";

/**
 * Header search: results under the field, updating as you type.
 *
 * It used to be a link to /search — a full navigation, a page render and a
 * back press, to answer "do you stock an AJ6". The catalogue is small and
 * already cached server-side, so the answer costs a few hundred bytes and
 * belongs where the question was asked.
 *
 * /search still exists and still works without JavaScript. This is the fast
 * path, not the only one: submitting goes there for the full grid, and so
 * does "View all N results".
 *
 * Two things that look like detail and are not:
 *
 *   - Every request carries an `AbortController`, and a superseded one is
 *     cancelled. Responses do not arrive in the order they were sent, so
 *     without this a slow "amp" can land after a fast "amplifier" and leave
 *     the reader looking at results for a word they finished typing.
 *   - `seq` guards the same race a second time, for responses already past
 *     the abort. Only a reply newer than what is on screen may paint.
 */

/** Long enough to skip most intermediate keystrokes, short enough to feel live. */
const DEBOUNCE_MS = 140;

export function SearchPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const abort = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(-1);

  const trimmed = query.trim();

  /* Focus the field on open, and reset when it closes. */
  useEffect(() => {
    if (!open) {
      setQuery("");
      setData(null);
      setCursor(-1);
      abort.current?.abort();
      return;
    }
    // A frame's delay: the input has to exist and be laid out before iOS
    // will move focus to it.
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  /* Debounced fetch. */
  useEffect(() => {
    if (!open) return;

    if (!trimmed) {
      abort.current?.abort();
      setData(null);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      const ticket = ++seq.current;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as SearchResponse;
        if (ticket !== seq.current) return;
        setData(payload);
        setCursor(-1);
      } catch {
        // An abort is the normal path here, not a failure.
        if (ticket === seq.current) setData(null);
      } finally {
        if (ticket === seq.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [open, trimmed]);

  /* Escape closes; a click outside closes. */
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointer = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };

    document.addEventListener("keydown", onKey);
    // Deferred a tick, or the very click that opened the panel closes it.
    const timer = window.setTimeout(
      () => document.addEventListener("pointerdown", onPointer),
      0,
    );

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  const hits = data?.hits ?? [];

  const goToResults = useCallback(() => {
    if (!trimmed) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [onClose, router, trimmed]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => (hits.length ? (c + 1) % hits.length : -1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => (hits.length ? (c <= 0 ? hits.length - 1 : c - 1) : -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[cursor];
      if (hit) {
        onClose();
        router.push(`/products/${hit.handle}`);
      } else {
        goToResults();
      }
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[150] bg-ink/70 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search the catalogue"
        className="fixed inset-x-0 top-0 z-[160] border-b border-hairline bg-ink gutter-x"
      >
        <div className="p1-shell py-5">
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              goToResults();
            }}
            className="flex items-center gap-3 border-b border-hairline pb-4"
          >
            <label htmlFor="header-search" className="sr-only">
              Search the catalogue
            </label>
            <input
              ref={inputRef}
              id="header-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="AJ6, amplifier, XLR…"
              autoComplete="off"
              // `type="search"` is right for the semantics and brings WebKit's own
              // clear glyph with it, which lands next to this panel's Close and
              // reads as two close buttons. Hidden; the field is cleared by
              // closing, and the text is selectable anyway.
              className="min-h-11 flex-1 border-0 bg-transparent text-[16px] text-strong outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:appearance-none"
            />
            <button
              type="button"
              onClick={onClose}
              className="p1-tap p1-mono cursor-pointer border-0 bg-transparent text-soft hover:text-signal"
            >
              Close ✕
            </button>
          </form>

          <div className="min-h-[72px] pt-4">
            {!trimmed ? (
              <p className="p1-mono text-faint">
                Search by product name, SKU, category or tag.
              </p>
            ) : hits.length === 0 ? (
              <p className="p1-mono text-faint">
                {loading ? "Searching…" : `Nothing matched “${trimmed}”.`}
              </p>
            ) : (
              <>
                <ul className="m-0 flex list-none flex-col p-0">
                  {hits.map((hit, index) => (
                    <Row
                      key={hit.handle}
                      hit={hit}
                      active={index === cursor}
                      onNavigate={onClose}
                    />
                  ))}
                </ul>

                {data && data.total > hits.length ? (
                  <button
                    type="button"
                    onClick={goToResults}
                    className="p1-mono p1-tap-row mt-3 flex w-full cursor-pointer items-center justify-between border-0 bg-transparent text-soft hover:text-signal"
                  >
                    <span>View all {data.total} results</span>
                    <span aria-hidden="true">→</span>
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({
  hit,
  active,
  onNavigate,
}: {
  hit: SearchHit;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={`/products/${hit.handle}`}
        onClick={onNavigate}
        aria-current={active ? "true" : undefined}
        className={`flex items-center gap-4 border-b border-hairline py-3 transition-colors duration-[120ms] ease-signal ${
          active ? "bg-panel" : "hover:bg-panel"
        }`}
      >
        <span className="relative block h-12 w-12 flex-none overflow-hidden border border-hairline bg-panel">
          {hit.image ? (
            <Media src={hit.image.src} alt="" sizes="48px" />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] leading-snug text-strong">
            {hit.title}
          </span>
          <span className="p1-mono mt-1 block text-faint">
            {hit.category}
            {hit.inStock ? "" : " · out of stock"}
          </span>
        </span>

        <span className="p1-mono flex-none text-signal">{hit.price}</span>
      </Link>
    </li>
  );
}
