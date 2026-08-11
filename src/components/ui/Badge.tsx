import type { ReactNode } from "react";

export type BadgeTone = "ash" | "signal" | "muted";

const toneClass: Record<BadgeTone, string> = {
  ash: "bg-ash text-ink",
  signal: "bg-signal text-ink",
  muted: "border border-hairline text-[rgba(230,230,230,0.6)]",
};

export function Badge({
  children,
  tone = "ash",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-1 leading-none ${toneClass[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
