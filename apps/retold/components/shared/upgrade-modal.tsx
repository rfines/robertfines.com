"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, X } from "lucide-react";
import { UPGRADE_FEATURES, type FeatureId } from "@/lib/upgrade-features";
import { PLAN_PRICING } from "@/lib/plan";
import { PLAN_HIGHLIGHTS } from "@/lib/plan-features";

interface UpgradeModalContextValue {
  openUpgrade: (featureId: FeatureId) => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null);

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx)
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  return ctx;
}

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const router = useRouter();

  const openUpgrade = useCallback((featureId: FeatureId) => {
    setActiveFeature(featureId);
  }, []);

  const close = useCallback(() => {
    setActiveFeature(null);
  }, []);

  useEffect(() => {
    if (!activeFeature) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeFeature, close]);

  const meta = activeFeature ? UPGRADE_FEATURES[activeFeature] : null;
  const pricing = meta ? PLAN_PRICING[meta.requiredPlan] : null;
  const highlights = meta
    ? PLAN_HIGHLIGHTS[meta.requiredPlan as keyof typeof PLAN_HIGHLIGHTS]
    : null;

  return (
    <UpgradeModalContext.Provider value={{ openUpgrade }}>
      {children}
      <AnimatePresence>
        {activeFeature && meta && pricing && (
          <>
            {/* Backdrop */}
            <motion.div
              key="upgrade-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={close}
            />

            {/* Panel */}
            <motion.div
              key="upgrade-panel"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="upgrade-modal-title"
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
                  <Lock size={20} />
                </div>

                {/* Feature info */}
                <h2
                  id="upgrade-modal-title"
                  className="text-lg font-bold text-foreground"
                >
                  {meta.name}
                </h2>
                <p className="text-sm text-muted mt-1">{meta.valueProp}</p>

                {/* Plan badge + price */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-accent">
                    {pricing.label}
                  </span>
                  <span className="text-sm text-foreground font-bold">
                    {pricing.price}
                  </span>
                  {pricing.period && (
                    <span className="text-xs text-muted">{pricing.period}</span>
                  )}
                </div>

                {/* Highlights */}
                {highlights && (
                  <ul className="mt-3 space-y-1.5">
                    {highlights.slice(0, 4).map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-muted"
                      >
                        <Check
                          size={12}
                          className="text-accent shrink-0 mt-0.5"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <button
                  onClick={() => {
                    close();
                    router.push("/dashboard/billing");
                  }}
                  className="mt-5 w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
                >
                  Upgrade to {pricing.label}
                </button>

                {/* Secondary */}
                <button
                  onClick={() => {
                    close();
                    router.push("/dashboard/billing");
                  }}
                  className="mt-2 w-full py-2 text-xs text-muted hover:text-foreground transition-colors text-center"
                >
                  Compare all plans
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </UpgradeModalContext.Provider>
  );
}
