"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "pro1st-theme";

/**
 * Theme state.
 *
 * Dark is the brand's native mode and the default. A stored choice always
 * wins; with no stored choice we follow the OS. The actual DOM attribute is
 * set by the inline script in <head> before first paint — this provider only
 * keeps React in sync and handles changes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") setThemeState(attr);

    // Enable colour transitions only after mount, so the first paint doesn't
    // animate from the default palette into the stored one.
    document.documentElement.classList.add("p1-theme-ready");

    // Follow the OS while the visitor hasn't expressed a preference.
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem(THEME_STORAGE_KEY)) return;
      } catch {
        /* storage unavailable — follow the OS */
      }
      const next: Theme = event.matches ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      setThemeState(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the choice lasts for this page only */
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme],
  );

  const value = useMemo(
    () => ({ theme, toggle, setTheme }),
    [theme, toggle, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Runs before first paint to stamp the theme on <html>.
 *
 * Without this the page paints dark, then flips to light on hydration — the
 * flash of wrong theme that makes a site feel cheap.
 */
export const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = stored || (prefersLight ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;
