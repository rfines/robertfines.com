"use client";

import { useTransition } from "react";

type Props = {
  albumId: string;
  albumLabel: string;
  action: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

export function DeleteButton({ albumId, albumLabel, action }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete "${albumLabel}"? This cannot be undone.`)) return;
        startTransition(async () => {
          const result = await action(albumId);
          if (!result.ok) alert(result.error);
        });
      }}
      className="text-xs text-[var(--muted)] hover:text-red-400 transition-colors disabled:opacity-50"
    >
      {pending ? "deleting..." : "delete"}
    </button>
  );
}
