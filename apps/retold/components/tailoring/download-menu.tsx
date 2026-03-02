"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Plan } from "@/lib/plan";
import { canExportMarkdown, canExportPdf } from "@/lib/plan";
import { useUpgradeModal } from "@/components/shared/upgrade-modal";
import type { FeatureId } from "@/lib/upgrade-features";

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
  featureId?: FeatureId;
}

export function DownloadMenu({ tailoredId, plan, label = "Download" }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { openUpgrade } = useUpgradeModal();

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
      featureId: "export-markdown",
    },
    {
      format: "pdf",
      label: "PDF (styled)",
      locked: !canExportPdf(plan),
      badge: "Pro",
      featureId: "export-pdf",
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
        <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-10 overflow-hidden">
          {options.map(({ format, label: optLabel, locked, badge, featureId }) =>
            locked ? (
              <button
                key={format}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (featureId) openUpgrade(featureId);
                }}
                className="flex items-center justify-between px-3 py-2 text-xs text-muted hover:text-foreground hover:bg-accent/5 transition-colors w-full text-left"
              >
                <span className="flex items-center gap-1.5">
                  <Lock size={10} />
                  {optLabel}
                </span>
                {badge && (
                  <span className="text-[10px] border border-accent/30 text-accent rounded px-1">
                    {badge}
                  </span>
                )}
              </button>
            ) : (
              <a
                key={format}
                href={`/api/tailored/${tailoredId}/download${format !== "docx" ? `?format=${format}` : ""}`}
                download
                className="flex items-center px-3 py-2 text-xs text-foreground hover:bg-surface transition-colors"
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
