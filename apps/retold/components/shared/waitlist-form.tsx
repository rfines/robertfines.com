"use client";

import { useState } from "react";

interface WaitlistFormProps {
  source: string;
  compact?: boolean;
}

export function WaitlistForm({ source, compact }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error?.fieldErrors?.email?.[0] ?? "Something went wrong"
        );
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-4">
        <p className="text-sm font-medium text-foreground">
          You&apos;re on the list!
        </p>
        <p className="text-xs text-muted mt-1">
          We&apos;ll reach out when spots open up.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "flex flex-col gap-3" : "space-y-4"}
    >
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full text-sm px-3 py-2.5 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        className="w-full text-sm px-3 py-2.5 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full text-sm font-semibold py-2.5 rounded-lg bg-accent hover:bg-accent-hover hover:shadow-[var(--accent-glow)] text-white transition-all disabled:opacity-50"
      >
        {status === "submitting" ? "Joining..." : "Join the waitlist"}
      </button>
      {status === "error" && (
        <p className="text-xs text-destructive text-center">{errorMsg}</p>
      )}
    </form>
  );
}
