"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lock } from "lucide-react";

const MAX_LENGTH = 500;

interface InstructionsFieldProps {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  onLockedClick?: () => void;
}

export function InstructionsField({ value, onChange, locked, onLockedClick }: InstructionsFieldProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Label htmlFor="userInstructions">Custom instructions (optional)</Label>
        {locked && (
          <span className="text-[10px] bg-surface text-accent border border-accent/30 rounded px-1.5 py-0.5 flex items-center gap-1">
            <Lock size={9} />
            Starter
          </span>
        )}
      </div>
      <div className="relative">
        <Textarea
          id="userInstructions"
          placeholder="e.g. Emphasize my leadership experience and Python skills"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={locked}
          maxLength={MAX_LENGTH}
          className="min-h-[80px]"
        />
        {locked && onLockedClick && (
          <button
            type="button"
            onClick={onLockedClick}
            className="absolute inset-0 cursor-pointer"
            aria-label="Upgrade to unlock custom instructions"
          />
        )}
      </div>
      {!locked && (
        <p className="text-xs text-muted mt-1">{value.length}/{MAX_LENGTH}</p>
      )}
    </div>
  );
}
