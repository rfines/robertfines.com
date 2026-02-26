"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lock } from "lucide-react";

const MAX_LENGTH = 500;

interface InstructionsFieldProps {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
}

export function InstructionsField({ value, onChange, locked }: InstructionsFieldProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Label htmlFor="userInstructions">Custom instructions (optional)</Label>
        {locked && (
          <span className="text-[10px] bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] rounded px-1.5 py-0.5 flex items-center gap-1">
            <Lock size={9} />
            Starter
          </span>
        )}
      </div>
      <Textarea
        id="userInstructions"
        placeholder={
          locked
            ? "Upgrade to Starter to add custom instructions"
            : "e.g. Emphasize my leadership experience and Python skills"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked}
        maxLength={MAX_LENGTH}
        className="min-h-[80px]"
      />
      {!locked && (
        <p className="text-xs text-[var(--muted)] mt-1">{value.length}/{MAX_LENGTH}</p>
      )}
    </div>
  );
}
