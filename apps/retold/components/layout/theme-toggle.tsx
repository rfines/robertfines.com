"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";

const cycle = { light: "dark", dark: "system", system: "light" } as const;
const icons = { light: Sun, dark: Moon, system: Monitor } as const;
const labels = {
  light: "Switch to dark mode",
  dark: "Switch to system theme",
  system: "Switch to light mode",
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = icons[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(cycle[theme])}
      aria-label={labels[theme]}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
    >
      <Icon size={16} />
    </button>
  );
}
