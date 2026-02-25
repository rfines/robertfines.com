import { anthropic } from "./anthropic";

interface TailorInput {
  baseResume: string;
  jobTitle: string;
  company?: string;
  jobDescription: string;
}

interface TailorResult {
  tailoredText: string;
  tokensUsed: number;
}

const SYSTEM_PROMPT = `You are an expert resume writer specializing in ATS optimization and job-specific tailoring.

Your task: rewrite a candidate's base resume to closely match a specific job description.

Rules:
- NEVER fabricate facts, skills, or experience the candidate doesn't already have
- Reorder, reframe, and reword existing content to highlight what's most relevant to the role
- Mirror keywords and phrases from the job description naturally (do not keyword-stuff)
- Keep the same structure and sections as the original resume
- Write in the same voice and tense as the original
- Output ONLY the tailored resume text — no preamble, explanation, or commentary
- Preserve all dates, company names, job titles, and factual details exactly as written`;

export async function tailorResume({
  baseResume,
  jobTitle,
  company,
  jobDescription,
}: TailorInput): Promise<TailorResult> {
  const roleTarget = company ? `${jobTitle} at ${company}` : jobTitle;

  const userMessage = `TARGET ROLE: ${roleTarget}

JOB DESCRIPTION:
${jobDescription}

BASE RESUME:
${baseResume}

Please tailor the base resume for this specific role.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
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
