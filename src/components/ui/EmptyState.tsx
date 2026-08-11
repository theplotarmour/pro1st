import type { ReactNode } from "react";

interface EmptyStateProps {
  /** The one line the user reads. Keep it short and mono, like the design. */
  message: string;
  action?: ReactNode;
  className?: string;
}

/** Designed empty state — never leave a blank region or a browser default. */
export function EmptyState({
  message,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-6 border border-hairline bg-panel px-6 py-20 text-center ${className}`.trim()}
    >
      <p className="p1-mono m-0 text-[rgba(230,230,230,0.35)]">{message}</p>
      {action}
    </div>
  );
}
