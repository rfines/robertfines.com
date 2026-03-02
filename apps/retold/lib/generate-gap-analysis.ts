import { anthropic } from "./anthropic";

export interface GapItem {
  requirement: string; // JD requirement not addressed in the resume
  suggestion: string;  // Specific, actionable instruction to close the gap
  section: string;     // Which resume section to update (e.g. "Work Experience", "Skills")
  priority: "high" | "medium" | "low";
}

export interface GapAnalysisResult {
  gaps: GapItem[];
  skillsToAdd: string[]; // Hard skills / tools from the JD genuinely absent from the resume
  tokensUsed: number;
}

const SYSTEM_PROMPT = `You are an expert resume coach and ATS specialist. Your job is to analyze a resume against a job description and identify specific, actionable gaps.

Output ONLY a JSON object with this exact shape — no prose, no markdown fences:

{
  "gaps": [
    {
      "requirement": "<JD requirement not addressed in resume>",
      "suggestion": "<Concrete instruction: what to add, rewrite, or highlight>",
      "section": "<Resume section to update: Work Experience | Skills | Education | Summary | Projects>",
      "priority": "high" | "medium" | "low"
    }
  ],
  "skillsToAdd": ["<skill>", "<skill>"]
}

Rules:
- Identify 3–7 of the most impactful gaps (not every possible improvement)
- Only flag genuine gaps — do not hallucinate requirements the JD doesn't have
- "skillsToAdd" are hard skills, tools, technologies, or certifications from the JD that are completely absent from the resume (not just phrased differently)
- Prioritise gaps by their likely impact on the hiring decision: high = must-have, medium = should-have, low = nice-to-have
- Write suggestions in second person, imperative ("Add a bullet showing...", "Include your experience with...")
- Output must be valid JSON — no trailing commas, no comments`;

export async function generateGapAnalysis({
  resumeText,
  tailoredText,
  jobTitle,
  company,
  jobDescription,
}: {
  resumeText: string;
  tailoredText: string;
  jobTitle: string;
  company?: string;
  jobDescription: string;
}): Promise<GapAnalysisResult> {
  const roleTarget = company ? `${jobTitle} at ${company}` : jobTitle;

  const userMessage = `TARGET ROLE: ${roleTarget}

JOB DESCRIPTION:
${jobDescription}

TAILORED RESUME:
${tailoredText}

Identify the most impactful gaps between the resume and job description. Focus on what is MISSING or UNDERREPRESENTED — not on what is already well-addressed.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const parsed = JSON.parse(content.text.trim()) as Omit<GapAnalysisResult, "tokensUsed">;

  const tokensUsed =
    (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

  return {
    gaps: parsed.gaps ?? [],
    skillsToAdd: parsed.skillsToAdd ?? [],
    tokensUsed,
  };
}
