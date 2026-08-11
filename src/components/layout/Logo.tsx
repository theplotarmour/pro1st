import Link from "next/link";

/** Wordmark + rotating signal arc. The arc pulse is CSS-only. */
export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="PRO1ST home"
      className="flex flex-none items-center gap-2.5"
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="flex-none"
      >
        <circle
          cx="20"
          cy="20"
          r="15"
          stroke="rgba(230,230,230,.45)"
          strokeWidth="1.5"
          strokeDasharray="60 34"
          transform="rotate(-40 20 20)"
        />
        <circle
          cx="20"
          cy="20"
          r="15"
          stroke="#FF6A00"
          strokeWidth="1.5"
          strokeDasharray="20 74"
          transform="rotate(120 20 20)"
          style={{ animation: "p1-arc 6s infinite" }}
        />
        <text
          x="20"
          y="25"
          textAnchor="middle"
          fontFamily="var(--f-d)"
          fontSize="12"
          fontWeight="700"
          fill="#E6E6E6"
        >
          1
        </text>
      </svg>
      <span
        className="overflow-hidden whitespace-nowrap font-display text-[19px] font-bold tracking-[-0.02em] text-white transition-[opacity,max-width] duration-300 ease-signal"
        style={{
          opacity: collapsed ? 0 : 1,
          maxWidth: collapsed ? 0 : 140,
        }}
      >
        PRO<span className="text-signal">·</span>1ST
      </span>
    </Link>
  );
}
