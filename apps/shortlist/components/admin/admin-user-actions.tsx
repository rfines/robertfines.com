"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface AdminUserActionsProps {
  userId: string;
  plan: string;
  role: string;
  monthlyRunLimit: number | null;
}

export function AdminUserActions({
  userId,
  plan,
  role,
  monthlyRunLimit,
}: AdminUserActionsProps) {
  const router = useRouter();
  const [planValue, setPlanValue] = useState(plan);
  const [roleValue, setRoleValue] = useState(role);
  // Empty string = "use plan default" (null in DB); a number string = custom override
  const [runLimitValue, setRunLimitValue] = useState(
    monthlyRunLimit !== null ? String(monthlyRunLimit) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty =
    planValue !== plan ||
    roleValue !== role ||
    runLimitValue !== (monthlyRunLimit !== null ? String(monthlyRunLimit) : "");

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const monthlyRunLimitPayload =
        runLimitValue === "" ? null : parseInt(runLimitValue, 10);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planValue,
          role: roleValue,
          monthlyRunLimit: monthlyRunLimitPayload,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
      <h2 className="text-sm font-medium text-[var(--foreground)] mb-4">Account Settings</h2>
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Plan</label>
          <select
            value={planValue}
            onChange={(e) => setPlanValue(e.target.value)}
            className="text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="agency">Agency</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">Role</label>
          <select
            value={roleValue}
            onChange={(e) => setRoleValue(e.target.value)}
            className="text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Monthly run limit
          </label>
          <input
            type="number"
            min={0}
            placeholder="Plan default"
            value={runLimitValue}
            onChange={(e) => setRunLimitValue(e.target.value)}
            className="text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-32 placeholder:text-[var(--muted)]"
          />
          <p className="text-[10px] text-[var(--muted)] mt-0.5">
            Empty = plan default · free: 10 · starter: 100 · pro/agency: ∞
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
      {saveError && (
        <p className="text-xs text-[var(--destructive)] mt-2">{saveError}</p>
      )}
      {roleValue === "admin" && roleValue !== role && (
        <p className="text-xs text-yellow-400 mt-2">
          Role change takes effect on the user&apos;s next sign-in.
        </p>
      )}
    </div>
  );
}

interface ReprocessButtonProps {
  userId: string;
  tailoredId: string;
}

export function ReprocessButton({ userId, tailoredId }: ReprocessButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleClick() {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch(
        `/api/admin/users/${userId}/tailored/${tailoredId}/reprocess`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      setState("success");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      className={cn(
        "inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors",
        state === "success"
          ? "border-green-400/30 text-green-400 bg-green-400/10"
          : state === "error"
          ? "border-[var(--destructive)]/30 text-[var(--destructive)] bg-[var(--destructive)]/10"
          : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]"
      )}
    >
      {state === "loading" ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : state === "success" ? (
        <Check size={10} />
      ) : state === "error" ? (
        <AlertCircle size={10} />
      ) : (
        <RotateCcw size={10} />
      )}
      {state === "loading"
        ? "Processing…"
        : state === "success"
        ? "Done"
        : state === "error"
        ? "Failed — retry?"
        : "Reprocess"}
    </button>
  );
}
