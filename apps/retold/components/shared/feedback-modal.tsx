"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";
import { useUpgradeModal } from "@/components/shared/upgrade-modal";
import type { Plan } from "@/lib/plan";

const CATEGORIES = [
  { value: "tailoring_quality", label: "Tailoring Quality" },
  { value: "keyword_matching", label: "Keyword Matching" },
  { value: "export_formatting", label: "Export & Formatting" },
  { value: "feature_request", label: "Feature Request" },
  { value: "ui_usability", label: "UI & Usability" },
  { value: "other", label: "Other" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

interface FeedbackContextValue {
  openFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx)
    throw new Error("useFeedback must be used within FeedbackProvider");
  return ctx;
}

export function FeedbackProvider({
  plan,
  children,
}: {
  plan: Plan;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pathname = usePathname();
  const { toast } = useToast();
  const { openUpgrade } = useUpgradeModal();

  const openFeedback = useCallback(() => {
    if (plan === "free") {
      openUpgrade("feedback");
      return;
    }
    setOpen(true);
  }, [plan, openUpgrade]);

  const close = useCallback(() => {
    setOpen(false);
    setCategory(null);
    setDetails("");
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  async function handleSubmit() {
    if (!category || !details.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          details: details.trim(),
          pagePath: pathname,
        }),
      });
      if (!res.ok) throw new Error();
      close();
      toast("Feedback sent — thank you!", "success");
    } catch {
      toast("Something went wrong", "destructive");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = category !== null && details.trim().length > 0 && !submitting;

  return (
    <FeedbackContext.Provider value={{ openFeedback }}>
      {children}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="feedback-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={close}
            />

            {/* Panel */}
            <motion.div
              key="feedback-panel"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="relative bg-surface border border-border rounded-xl shadow-[var(--shadow-xl)] max-w-md w-full p-6 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close */}
                <button
                  onClick={close}
                  aria-label="Close"
                  className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent mb-4">
                  <MessageSquare size={20} />
                </div>

                {/* Heading */}
                <h2
                  id="feedback-modal-title"
                  className="text-lg font-bold text-foreground"
                >
                  Send Feedback
                </h2>
                <p className="text-sm text-muted mt-1">
                  Help us improve Retold
                </p>

                {/* Category pills */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm transition-colors text-left",
                        category === cat.value
                          ? "bg-accent/10 border-accent text-accent"
                          : "border-border text-muted hover:text-foreground hover:border-foreground/20"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Details textarea */}
                <div className="mt-4">
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                    placeholder="Tell us more..."
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent resize-none"
                  />
                  <p className="text-[11px] text-muted text-right mt-1">
                    {details.length}/500
                  </p>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="mt-3 w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Send Feedback"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </FeedbackContext.Provider>
  );
}
