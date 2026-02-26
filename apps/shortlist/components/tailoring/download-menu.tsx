"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Plan } from "@/lib/plan";
import { canExportMarkdown, canExportPdf } from "@/lib/plan";

interface DownloadMenuProps {
  tailoredId: string;
  plan: Plan;
  label?: string;
}

interface FormatOption {
  format: string;
  label: string;
  locked: boolean;
  badge?: string;
}

export function DownloadMenu({ tailoredId, plan, label = "Download" }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options: FormatOption[] = [
    { format: "docx", label: "Word (.docx)", locked: false },
    {
      format: "md",
      label: "Markdown (.md)",
      locked: !canExportMarkdown(plan),
      badge: "Starter",
    },
    {
      format: "pdf",
      label: "PDF (styled)",
      locked: !canExportPdf(plan),
      badge: "Pro",
    },
  ];

  return (
    <div ref={ref} className="relative">
      <Button size="sm" onClick={() => setOpen((v) => !v)}>
        <Download size={14} />
        {label}
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-10 overflow-hidden">
          {options.map(({ format, label: optLabel, locked, badge }) =>
            locked ? (
              <div
                key={format}
                className="flex items-center justify-between px-3 py-2 text-xs text-[var(--muted)] cursor-not-allowed opacity-60"
                title={`Upgrade to ${badge} to unlock`}
              >
                <span className="flex items-center gap-1.5">
                  <Lock size={10} />
                  {optLabel}
                </span>
                {badge && (
                  <span className="text-[10px] border border-[var(--border)] rounded px-1">
                    {badge}
                  </span>
                )}
              </div>
            ) : (
              <a
                key={format}
                href={`/api/tailored/${tailoredId}/download${format !== "docx" ? `?format=${format}` : ""}`}
                download
                className="flex items-center px-3 py-2 text-xs text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                onClick={() => setOpen(false)}
              >
                {optLabel}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
