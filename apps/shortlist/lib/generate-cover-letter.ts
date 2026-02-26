import { anthropic } from "./anthropic";

interface CoverLetterInput {
  tailoredResume: string;
  jobTitle: string;
  company?: string;
  jobDescription: string;
}

interface CoverLetterResult {
  coverLetterText: string;
  tokensUsed: number;
}

const COVER_LETTER_SYSTEM_PROMPT = `You are an expert cover letter writer who crafts compelling, personalized letters.

Your task: write a professional cover letter based on a tailored resume and a specific job description.

Rules:
- Address the letter with "Dear Hiring Manager,"
- Write 3 paragraphs: (1) opening with the role and a strong hook, (2) 2-3 specific accomplishments from the resume that directly address the JD's needs, (3) closing with enthusiasm and a call to action
- Keep the total length to 250-350 words
- Mirror the vocabulary and tone of the job description naturally
- NEVER fabricate facts, metrics, or accomplishments not present in the resume
- Write in first person, professional but warm tone
- Output ONLY the letter body — no header, date, address block, or signature`;

export async function generateCoverLetter({
  tailoredResume,
  jobTitle,
  company,
  jobDescription,
}: CoverLetterInput): Promise<CoverLetterResult> {
  const roleTarget = company ? `${jobTitle} at ${company}` : jobTitle;

  const userMessage = `TARGET ROLE: ${roleTarget}

JOB DESCRIPTION:
${jobDescription}

TAILORED RESUME:
${tailoredResume}

Please write a cover letter for this role based on the resume above.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: COVER_LETTER_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const tokensUsed =
    (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

  return {
    coverLetterText: content.text.trim(),
    tokensUsed,
  };
}
