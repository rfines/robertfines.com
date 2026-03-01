import { anthropic } from "./anthropic";

const SYSTEM_PROMPT = `You are a technical recruiter and resume expert. Extract the specific, concrete skills, tools, technologies, and domain knowledge required by the following job description.

Rules:
- Include: programming languages, frameworks, libraries, platforms, tools, methodologies, domain-specific knowledge (e.g. "machine learning", "distributed systems", "HIPAA compliance")
- Exclude: generic soft skills ("communication", "teamwork", "leadership"), vague qualifiers ("strong", "proven", "excellent"), and HR/benefits boilerplate
- Normalize to the canonical form: "TypeScript" not "typescript", "React" not "reactjs", "PostgreSQL" not "postgres"
- For compound skills keep them together: "machine learning", "computer vision", "system design", "REST APIs"
- Return ONLY a valid JSON array of strings, with no preamble or commentary
- Aim for 10–40 skills; omit duplicates and near-duplicates

Example output:
["TypeScript", "React", "Node.js", "PostgreSQL", "REST APIs", "GraphQL", "AWS", "Docker", "CI/CD", "system design"]`;

export async function extractJdSkills(jobDescription: string): Promise<string[]> {
  if (!jobDescription.trim()) return [];

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-3-5-20241022",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: jobDescription.slice(0, 8000) }],
    });

    const content = response.content[0];
    if (content.type !== "text") return [];

    const parsed = JSON.parse(content.text.trim());
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
  } catch {
    return [];
  }
}
