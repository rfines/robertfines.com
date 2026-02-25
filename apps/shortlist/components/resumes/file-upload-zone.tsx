"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/cn";

interface FileUploadZoneProps {
  onExtracted: (text: string) => void;
  disabled?: boolean;
}

type UploadState = "idle" | "uploading" | "extracting" | "done" | "error";

export function FileUploadZone({ onExtracted, disabled }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  async function handleFile(file: File) {
    const contentType =
      file.name.endsWith(".pdf")
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const fileType = file.name.endsWith(".pdf") ? "pdf" : "docx";
    setState("uploading");
    setProgress(0);
    setErrorMsg(null);

    try {
      // 1. Get presigned URL
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { presignedUrl, s3Key } = await presignRes.json();

      // 2. Upload to S3
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 80));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.send(file);
      });

      // 3. Extract text
      setState("extracting");
      setProgress(90);
      const extractRes = await fetch("/api/uploads/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key, fileType }),
      });
      if (!extractRes.ok) throw new Error("Failed to extract text from file");
      const { text } = await extractRes.json();

      setProgress(100);
      setState("done");
      onExtracted(text);
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const label =
    state === "uploading"
      ? `Uploading… ${progress}%`
      : state === "extracting"
        ? "Extracting text…"
        : state === "done"
          ? "File processed"
          : "Drop PDF or DOCX here, or click to browse";

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer",
        isDragOver
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--border)] hover:border-[var(--accent)]/50",
        (disabled || state === "uploading" || state === "extracting") &&
          "pointer-events-none opacity-60",
        state === "done" && "border-green-500/40 bg-green-500/5"
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="sr-only"
        onChange={onFileChange}
      />

      <div className="flex flex-col items-center gap-3">
        <Upload
          size={24}
          className={cn(
            state === "done" ? "text-green-400" : "text-[var(--muted)]"
          )}
        />
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
          <p className="text-xs text-[var(--muted)] mt-1">PDF or DOCX, up to 10MB</p>
        </div>

        {(state === "uploading" || state === "extracting") && (
          <div className="w-full max-w-xs bg-[var(--border)] rounded-full h-1.5 mt-2">
            <div
              className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {state === "error" && errorMsg && (
          <p className="text-xs text-[var(--destructive)]">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
