/**
 * "Generate" a markdown file — the tailored text is already plain text,
 * so we just wrap it with a minimal header and return it as-is.
 */
export function generateMarkdown(
  tailoredText: string,
  jobTitle: string,
  company?: string | null
): string {
  const heading = company ? `${jobTitle} — ${company}` : jobTitle;
  return `# ${heading}\n\n${tailoredText}`;
}
