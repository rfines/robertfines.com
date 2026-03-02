export interface ParsedLine {
  type: "header" | "bullet" | "text" | "empty";
  text: string;
}

export function parseResumeLines(text: string): ParsedLine[] {
  return text.split("\n").map((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return { type: "empty", text: "" };

    const isHeader =
      trimmed === trimmed.toUpperCase() &&
      trimmed.length < 50 &&
      !/[^A-Z\s\-/&]/.test(trimmed);

    if (isHeader) return { type: "header", text: trimmed };

    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("·")) {
      return { type: "bullet", text: trimmed.replace(/^[•\-·]\s*/, "") };
    }

    return { type: "text", text: trimmed };
  });
}
