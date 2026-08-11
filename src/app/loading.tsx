import { Container } from "@/components/ui/Container";

/**
 * Route-level loading state. Mirrors the interior page rhythm so the shell
 * doesn't jump when content arrives.
 */
export default function Loading() {
  return (
    <Container as="section" className="pb-32 pt-[184px]">
      <div className="p1-eyebrow mb-6 flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-signal"
          style={{ animation: "p1-blink 1.8s infinite" }}
        />
        Loading
      </div>
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-4"
      >
        <span className="sr-only">Loading content</span>
        <div className="h-14 w-2/3 max-w-xl bg-panel" />
        <div className="h-14 w-1/2 max-w-md bg-panel" />
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square border border-hairline bg-panel"
            />
          ))}
        </div>
      </div>
    </Container>
  );
}
