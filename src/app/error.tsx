"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";

/**
 * Route error boundary.
 *
 * Most failures here are the storefront being unreachable, so the copy says
 * what actually happened and offers a retry rather than a stack trace.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[pro1st] route error:", error);
  }, [error]);

  return (
    <Container as="section" className="pb-32 pt-[184px]">
      <div className="p1-eyebrow mb-6">[ Signal lost ]</div>
      <h1 className="p1-h-xl max-w-[16ch] text-strong">
        We couldn&apos;t load that.
      </h1>
      <p className="p1-lead mt-8 max-w-[52ch]">
        The store didn&apos;t respond. This is usually temporary — try again,
        or call us and we&apos;ll sort it out directly.
      </p>
      {error.digest ? (
        <p className="p1-mono mt-6 text-faint">
          Reference {error.digest}
        </p>
      ) : null}
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="p1-btn p1-btn--primary">
          Try again
        </button>
        <a href="/contact" className="p1-btn p1-btn--outline">
          Get in touch
        </a>
      </div>
    </Container>
  );
}
