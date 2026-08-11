import Link from "next/link";
import { Wordmark } from "./Wordmark";

/**
 * Header logo — the client's real PRO1ST mark.
 *
 * The mark is multi-colour artwork intended for a light ground, so it sits on
 * its own plate rather than being recoloured or knocked out. That keeps the
 * navy "P" legible against the near-black UI without altering the brand asset.
 *
 * `collapsed` shrinks it as the header condenses on scroll, matching the
 * approved behaviour of the previous wordmark.
 */
export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="PRO1ST — home"
      className="group flex flex-none items-center"
    >
      <span
        className="flex items-center justify-center rounded-[6px] bg-white transition-[height,width,padding] duration-[420ms] ease-signal"
        style={{
          height: collapsed ? 34 : 42,
          paddingInline: collapsed ? 7 : 9,
          paddingBlock: collapsed ? 4 : 5,
        }}
      >
        <Wordmark className="h-full w-auto" title="PRO1ST" />
      </span>
    </Link>
  );
}
