import { anthropic } from "./anthropic";
import type { Intensity } from "@/types";
import type { AtsWarning } from "@/lib/ats-warnings";

interface TailorInput {
  baseResume: string;
  jobTitle: string;
  company?: string;
  jobDescription: string;
  intensity?: Intensity;
  userInstructions?: string;
  atsWarnings?: AtsWarning[];
}

interface TailorResult {
  tailoredText: string;
  tokensUsed: number;
}

const INTENSITY_INSTRUCTIONS: Record<Intensity, string> = {
  conservative:
    "- Apply MINIMAL changes: only rephrase keywords lightly to match the job description. Preserve the original wording and structure as closely as possible. If a bullet already fits, leave it unchanged.",
  moderate:
    "- Apply MODERATE changes: reorder, reframe, and reword existing content to highlight what is most relevant. Mirror the job description's language naturally.",
  aggressive:
    "- Apply AGGRESSIVE changes: significantly restructure and reorder sections to maximize relevance. Rewrite bullets heavily to front-load the most relevant experience. You may consolidate or expand sections, but NEVER invent facts.",
};

const ATS_FIX_INSTRUCTIONS: Record<string, string> = {
  "table-detected":
    "Convert all pipe-character table layouts to plain bullet lists. Do not use | characters anywhere in the output.",
  "fancy-bullets":
    "Replace all decorative bullet characters (•, ▸, ▪, ★, ▶, ●, ■, etc.) with plain hyphens (-).",
  "decorative-separators":
    "Remove all decorative separator lines made of repeated characters (---, ===, ***, ___, etc.). Use blank lines between sections instead.",
  "missing-sections":
    "Ensure the resume has clearly labeled section headers for Experience, Education, and Skills. Add any that are missing.",
  "long-lines":
    "Break up any lines longer than 120 characters. Eliminate multi-column layouts — all content must be in a single column.",
};

function buildSystemPrompt(intensity: Intensity, atsWarnings?: AtsWarning[]): string {
  const atsFixSection =
    atsWarnings && atsWarnings.length > 0
      ? `\n\nATS Formatting fixes (apply these in addition to tailoring):\n${atsWarnings
          .map((w) => `- ${ATS_FIX_INSTRUCTIONS[w.code] ?? w.message}`)
          .join("\n")}`
      : "";

  return `You are an expert resume writer specializing in ATS optimization and job-specific tailoring.

Your task: rewrite a candidate's base resume to closely match a specific job description.

Rules:
- NEVER fabricate facts, skills, or experience the candidate doesn't already have
- Keep the same sections as the original resume
- Write in the same voice and tense as the original
- Output ONLY the tailored resume text — no preamble, explanation, or commentary
- Preserve all dates, company names, job titles, and factual details exactly as written
${INTENSITY_INSTRUCTIONS[intensity]}${atsFixSection}`;
}

export async function tailorResume({
  baseResume,
  jobTitle,
  company,
  jobDescription,
  intensity = "moderate",
  userInstructions,
  atsWarnings,
}: TailorInput): Promise<TailorResult> {
  const roleTarget = company ? `${jobTitle} at ${company}` : jobTitle;

  const userMessage = `TARGET ROLE: ${roleTarget}

JOB DESCRIPTION:
${jobDescription}

BASE RESUME:
${baseResume}

Please tailor the base resume for this specific role.${
    userInstructions
      ? `\n\nAdditional instructions from the candidate:\n${userInstructions}`
      : ""
  }`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: buildSystemPrompt(intensity, atsWarnings),
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const tokensUsed =
    (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

  return {
    tailoredText: content.text.trim(),
    tokensUsed,
  };
}
