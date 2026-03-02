"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

const STORAGE_KEY = "retold-theme";

// External store for theme — avoids setState-in-effect lint errors
let listeners: Array<() => void> = [];
let currentTheme: Theme = "system";
let currentResolved: ResolvedTheme = "light";

function getThemeSnapshot() {
  return { theme: currentTheme, resolved: currentResolved };
}

function getServerSnapshot() {
  return { theme: "system" as Theme, resolved: "light" as ResolvedTheme };
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  for (const listener of listeners) listener();
}

function updateTheme(next: Theme) {
  currentTheme = next;
  currentResolved = resolve(next);
  applyTheme(currentResolved);
  localStorage.setItem(STORAGE_KEY, next);
  emitChange();
}

// Initialize from localStorage (runs once on module load in browser)
if (typeof window !== "undefined") {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  currentTheme = stored ?? "system";
  currentResolved = resolve(currentTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolved: resolvedTheme } = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerSnapshot
  );

  // Listen for OS theme changes when in "system" mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      if (currentTheme === "system") {
        currentResolved = getSystemTheme();
        applyTheme(currentResolved);
        emitChange();
      }
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    updateTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
