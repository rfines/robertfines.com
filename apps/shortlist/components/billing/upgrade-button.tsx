"use client";

import { useState } from "react";

interface UpgradeButtonProps {
  priceId: string;
  label: string;
  isDowngrade?: boolean;
  featured?: boolean;
}

export function UpgradeButton({ priceId, label, isDowngrade, featured }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  const idleLabel = isDowngrade ? `Downgrade to ${label}` : `Upgrade to ${label}`;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
        featured
          ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
          : "border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--foreground)]"
      }`}
    >
      {loading ? "Processing…" : idleLabel}
    </button>
  );
}
