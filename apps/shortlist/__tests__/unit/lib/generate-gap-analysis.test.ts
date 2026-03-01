import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateGapAnalysis } from "@/lib/generate-gap-analysis";

// Mock the Anthropic client
vi.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}));

import { anthropic } from "@/lib/anthropic";

const VALID_OUTPUT = {
  gaps: [
    {
      requirement: "Node.js experience",
      suggestion: "Add a bullet in Work Experience showing your Node.js backend work.",
      section: "Work Experience",
      priority: "high",
    },
    {
      requirement: "Docker knowledge",
      suggestion: "Include Docker in your Skills section and mention containerized deployments.",
      section: "Skills",
      priority: "medium",
    },
  ],
  skillsToAdd: ["Node.js", "Docker", "Kubernetes"],
};

function mockClaudeResponse(json: unknown) {
  vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
    content: [{ type: "text", text: JSON.stringify(json) }],
    usage: { input_tokens: 400, output_tokens: 200 },
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateGapAnalysis", () => {
  const INPUT = {
    resumeText: "Software engineer with TypeScript and React experience.",
    tailoredText: "Senior engineer specializing in TypeScript and React.",
    jobTitle: "Senior Software Engineer",
    company: "Acme Corp",
    jobDescription: "We need a TypeScript engineer with React, Node.js, Docker, and Kubernetes.",
  };

  it("returns gaps and skillsToAdd from Claude response", async () => {
    mockClaudeResponse(VALID_OUTPUT);
    const result = await generateGapAnalysis(INPUT);

    expect(result.gaps).toHaveLength(2);
    expect(result.gaps[0].requirement).toBe("Node.js experience");
    expect(result.gaps[0].priority).toBe("high");
    expect(result.skillsToAdd).toEqual(["Node.js", "Docker", "Kubernetes"]);
  });

  it("includes tokensUsed in the result", async () => {
    mockClaudeResponse(VALID_OUTPUT);
    const result = await generateGapAnalysis(INPUT);

    expect(result.tokensUsed).toBe(600); // 400 input + 200 output
  });

  it("works without a company name", async () => {
    mockClaudeResponse(VALID_OUTPUT);
    const { company: _, ...inputWithoutCompany } = INPUT;
    const result = await generateGapAnalysis(inputWithoutCompany);
    expect(result.gaps).toBeDefined();
  });

  it("defaults gaps to empty array when Claude omits it", async () => {
    mockClaudeResponse({ skillsToAdd: ["Node.js"] });
    const result = await generateGapAnalysis(INPUT);
    expect(result.gaps).toEqual([]);
    expect(result.skillsToAdd).toEqual(["Node.js"]);
  });

  it("defaults skillsToAdd to empty array when Claude omits it", async () => {
    mockClaudeResponse({ gaps: [] });
    const result = await generateGapAnalysis(INPUT);
    expect(result.skillsToAdd).toEqual([]);
  });

  it("throws when Claude returns invalid JSON", async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      content: [{ type: "text", text: "This is not JSON" }],
      usage: { input_tokens: 100, output_tokens: 20 },
    } as never);

    await expect(generateGapAnalysis(INPUT)).rejects.toThrow();
  });

  it("throws when Claude returns a non-text content block", async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      content: [{ type: "tool_use", id: "x", name: "foo", input: {} }],
      usage: { input_tokens: 100, output_tokens: 0 },
    } as never);

    await expect(generateGapAnalysis(INPUT)).rejects.toThrow(
      "Unexpected response type from Claude"
    );
  });
});
