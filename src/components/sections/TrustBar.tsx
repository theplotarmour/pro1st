import { TargetIcon } from "@/components/layout/icons";
import { trustPoints } from "@/data/site";

export function TrustBar() {
  return (
    <section
      aria-label="Assurances"
      className="grid grid-cols-1 border-y border-hairline sm:grid-cols-2 xl:grid-cols-4"
    >
      {trustPoints.map((point) => (
        <div
          key={point}
          className="flex items-center gap-4 border-l border-hairline gutter-x py-10"
        >
          <TargetIcon />
          <span className="p1-mono leading-[1.5] text-[rgba(230,230,230,0.7)]">
            {point}
          </span>
        </div>
      ))}
    </section>
  );
}
