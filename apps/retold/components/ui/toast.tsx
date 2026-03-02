"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastVariant = "default" | "success" | "destructive" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "bg-surface border-border text-foreground",
  success: "bg-surface border-success/30 text-foreground",
  destructive: "bg-surface border-destructive/30 text-foreground",
  warning: "bg-surface border-warning/30 text-foreground",
};

const VARIANT_ICON: Record<ToastVariant, ReactNode> = {
  default: <Info size={16} className="text-accent shrink-0" />,
  success: <CheckCircle2 size={16} className="text-success shrink-0" />,
  destructive: <AlertTriangle size={16} className="text-destructive shrink-0" />,
  warning: <AlertTriangle size={16} className="text-warning shrink-0" />,
};

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "default") => {
    const id = String(++toastId);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-lg)] text-sm",
                VARIANT_STYLES[t.variant]
              )}
            >
              {VARIANT_ICON[t.variant]}
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted hover:text-foreground transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
