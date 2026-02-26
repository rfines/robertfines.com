export interface AtsWarning {
  code: string;
  severity: "error" | "warning";
  message: string;
  detail?: string;
}

const FANCY_BULLETS_RE = /[▪▸◦➔★•‣⁃▹▻◘○●◆◇■□▶▷]/u;
const SEPARATOR_RE = /^[=\-_*~#]{10,}$/;

const EXPECTED_SECTIONS = [
  { name: "experience", re: /\b(experience|work history|employment)\b/i },
  { name: "education", re: /\b(education|academic|degree|university|college)\b/i },
  { name: "skills", re: /\b(skills|technologies|tools|competencies|expertise)\b/i },
];

export function analyzeAtsWarnings(rawText: string): AtsWarning[] {
  const warnings: AtsWarning[] = [];
  const lines = rawText.split("\n");

  const tableLines = lines.filter((line) => (line.match(/\|/g) ?? []).length >= 2);
  if (tableLines.length > 0) {
    warnings.push({
      code: "table-detected",
      severity: "error",
      message: "Table-like formatting detected",
      detail: `${tableLines.length} line(s) contain pipe characters (|). Tables are not parsed reliably by ATS systems.`,
    });
  }

  const fancyBulletLines = lines.filter((line) => FANCY_BULLETS_RE.test(line));
  if (fancyBulletLines.length > 0) {
    warnings.push({
      code: "fancy-bullets",
      severity: "warning",
      message: "Non-standard bullet characters detected",
      detail: `${fancyBulletLines.length} line(s) use decorative bullet characters. Use plain hyphens (-) or asterisks (*) instead.`,
    });
  }

  const separatorLines = lines.filter((line) => SEPARATOR_RE.test(line.trim()));
  if (separatorLines.length > 0) {
    warnings.push({
      code: "decorative-separators",
      severity: "warning",
      message: "Decorative separator lines detected",
      detail: `${separatorLines.length} line(s) use repeated characters as visual dividers. These may be misread as content.`,
    });
  }

  const missingSections = EXPECTED_SECTIONS.filter(({ re }) => !re.test(rawText));
  if (missingSections.length > 0) {
    warnings.push({
      code: "missing-sections",
      severity: "warning",
      message: "Standard resume sections not detected",
      detail: `Could not find: ${missingSections.map((s) => s.name).join(", ")}. ATS systems scan for these section headers.`,
    });
  }

  const longLines = lines.filter((line) => line.length > 120);
  if (longLines.length > 0) {
    warnings.push({
      code: "long-lines",
      severity: "warning",
      message: "Very long lines detected",
      detail: `${longLines.length} line(s) exceed 120 characters, which may indicate multi-column layout or embedded tables that ATS cannot parse.`,
    });
  }

  return warnings;
}
