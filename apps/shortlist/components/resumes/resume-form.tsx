"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "./file-upload-zone";

type Mode = "text" | "file";

export function ResumeForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("text");
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), rawText: rawText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create resume");
      }
      const resume = await res.json();
      router.push(`/dashboard/resumes/${resume.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFileExtracted(extractedText: string) {
    if (!title.trim()) {
      setError("Please enter a title before uploading.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), rawText: extractedText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create resume");
      }
      const resume = await res.json();
      router.push(`/dashboard/resumes/${resume.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Resume Title</Label>
        <Input
          id="title"
          placeholder="e.g. Senior Engineer Resume 2025"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <div className="flex gap-1 mb-4">
          {(["text", "file"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                mode === m
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {m === "text" ? "Paste text" : "Upload file"}
            </button>
          ))}
        </div>

        {mode === "text" ? (
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rawText">Resume Content</Label>
              <Textarea
                id="rawText"
                placeholder="Paste your resume content here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="min-h-[320px] font-mono text-xs"
                required
              />
            </div>
            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !rawText.trim()}
            >
              {isSubmitting ? "Saving…" : "Save Resume"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <FileUploadZone
              onExtracted={handleFileExtracted}
              disabled={isSubmitting}
            />
            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
