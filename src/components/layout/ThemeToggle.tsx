"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";

/**
 * Dark/light switch.
 *
 * One control, two icons, crossfading and rotating through each other rather
 * than swapping — the state change is the animation. Both icons are always in
 * the DOM so there is nothing to load on toggle.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className={`relative grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-hairline bg-transparent transition-[border-color,background-color] duration-[320ms] ease-signal hover:border-signal ${className}`.trim()}
    >
      <span className="relative block h-[17px] w-[17px]">
        {/* Sun */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full transition-[opacity,transform] duration-[420ms] ease-signal"
          style={{
            opacity: isDark ? 1 : 0,
            transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.4)",
          }}
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
        </svg>

        {/* Moon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full transition-[opacity,transform] duration-[420ms] ease-signal"
          style={{
            opacity: isDark ? 0 : 1,
            transform: isDark ? "rotate(90deg) scale(0.4)" : "rotate(0deg) scale(1)",
          }}
        >
          <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z" />
        </svg>
      </span>
    </button>
  );
}
