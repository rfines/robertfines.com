"use client";

import { useState } from "react";

export function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] underline underline-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "Opening portal…" : "Manage subscription"}
    </button>
  );
}
