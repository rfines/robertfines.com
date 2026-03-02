"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/layout/theme-provider";
import {
  Search,
  LayoutDashboard,
  FileText,
  Sparkles,
  CreditCard,
  Pencil,
  Linkedin,
  Sun,
  Moon,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const nav = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const items: CommandItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} />, section: "Navigation", action: () => nav("/dashboard") },
    { id: "resumes", label: "Resumes", icon: <FileText size={16} />, section: "Navigation", action: () => nav("/dashboard/resumes") },
    { id: "tailored", label: "Tailored Versions", icon: <Sparkles size={16} />, section: "Navigation", action: () => nav("/dashboard/tailored") },
    { id: "billing", label: "Billing", icon: <CreditCard size={16} />, section: "Navigation", action: () => nav("/dashboard/billing") },
    { id: "bullet", label: "Bullet Rewriter", icon: <Pencil size={16} />, section: "Tools", action: () => nav("/dashboard/tools/bullet-rewriter") },
    { id: "linkedin", label: "LinkedIn Optimizer", icon: <Linkedin size={16} />, section: "Tools", action: () => nav("/dashboard/tools/linkedin") },
    { id: "new-resume", label: "Add New Resume", icon: <Plus size={16} />, section: "Actions", action: () => nav("/dashboard/resumes/new") },
    {
      id: "theme",
      label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`,
      icon: resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />,
      section: "Actions",
      action: () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        setOpen(false);
      },
    },
  ];

  const filtered = query
    ? items.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  // Group by section
  const sections = Array.from(new Set(filtered.map((i) => i.section)));

  // Reset state and open the palette
  const openPalette = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Keyboard shortcut to open/close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          setOpen(false);
        } else {
          openPalette();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, openPalette]);

  // Keyboard navigation within palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      filtered[activeIndex].action();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Reset active index when query changes — derived via onChange handler
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIndex(0);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-surface border border-border rounded-xl shadow-[var(--shadow-xl)] overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-border">
                <Search size={16} className="text-muted shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command or search..."
                  className="w-full py-3 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                />
                <kbd className="hidden sm:inline-flex text-[10px] text-muted bg-background border border-border rounded px-1.5 py-0.5">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted text-center">
                    No results found.
                  </p>
                ) : (
                  sections.map((section) => (
                    <div key={section}>
                      <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-muted uppercase tracking-widest">
                        {section}
                      </p>
                      {filtered
                        .filter((item) => item.section === section)
                        .map((item) => {
                          const idx = filtered.indexOf(item);
                          return (
                            <button
                              key={item.id}
                              onClick={item.action}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={cn(
                                "flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors text-left",
                                idx === activeIndex
                                  ? "bg-accent/10 text-accent"
                                  : "text-foreground hover:bg-background"
                              )}
                            >
                              <span className="shrink-0 text-muted">
                                {item.icon}
                              </span>
                              {item.label}
                            </button>
                          );
                        })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
