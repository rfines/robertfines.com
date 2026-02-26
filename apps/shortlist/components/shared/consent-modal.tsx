"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ConsentModal() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChoice(consent: boolean) {
    setIsSubmitting(true);
    try {
      await fetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent }),
      });
    } finally {
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          One quick thing before you start
        </h2>
        <p className="text-sm text-[var(--muted)] mb-6">
          Can we send you occasional product tips and updates? We won&apos;t spam you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => handleChoice(true)}
            disabled={isSubmitting}
            className="flex-1"
          >
            Yes, keep me in the loop
          </Button>
          <Button
            variant="outline"
            onClick={() => handleChoice(false)}
            disabled={isSubmitting}
            className="flex-1"
          >
            No thanks
          </Button>
        </div>
      </div>
    </div>
  );
}
