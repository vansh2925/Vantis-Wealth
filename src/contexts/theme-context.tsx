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

export type Theme = "light" | "dark";
export type ThemeChoice = Theme | "system";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

interface ThemeContextValue {
  theme: ThemeChoice;
  resolvedTheme: Theme;
  setTheme: (theme: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStored(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function applyTheme(choice: ThemeChoice, resolved: Theme) {
  const el = document.documentElement;
  el.classList.toggle("dark", resolved === "dark");
  el.style.colorScheme = resolved;
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* storage unavailable — still apply visually */
  }
}

/**
 * Minimal, dependency-free theme manager replacing next-themes.
 * The no-FOUC <head> script (see src/app/layout.tsx) applies the theme before
 * paint; this provider only syncs React state to it and reacts to changes.
 *
 * IMPORTANT: state is initialised to deterministic values that match the SSR
 * render, then hydrated from localStorage/matchMedia in a mount effect. This
 * avoids hydration mismatches (a client-only initializer would render a
 * different theme on the client's first pass than the server did).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Deterministic initial values == what SSR renders, so first client render
  // matches. Real values are read in the mount effect below.
  const [theme, setThemeChoice] = useState<ThemeChoice>("system");
  const [system, setSystem] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Read real values once, after mount, to stay in sync with the head script.
    setThemeChoice(readStored());
    setSystem(systemTheme());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystem(mql.matches ? "dark" : "light");
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [hydrated]);

  const resolvedTheme: Theme = theme === "system" ? system : theme;

  useEffect(() => {
    if (!hydrated) return;
    applyTheme(theme, resolvedTheme);
  }, [theme, resolvedTheme, hydrated]);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeChoice(next);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
