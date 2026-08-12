import Link from "next/link";
import { Wordmark } from "./Wordmark";

/**
 * Header logo — the client's real PRO1ST mark.
 *
 * Sits directly on the dark surface. The white plate it used to need is gone —
 * the mark is recoloured for the dark ground instead, so the header reads as
 * one surface rather than a logo patched onto it.
 */
export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="PRO1ST — home"
      className="group flex flex-none items-center"
      style={
        {
          "--wordmark-ink": "var(--text-strong)",
          "--wordmark-accent": "var(--signal)",
        } as React.CSSProperties
      }
    >
      <Wordmark
        className="w-auto transition-[height] duration-[420ms] ease-signal"
        title="PRO1ST"
        style={{ height: collapsed ? 26 : 32 }}
      />
    </Link>
  );
}
