import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}));

import { tailorResume } from "@/lib/tailor-resume";
import { anthropic } from "@/lib/anthropic";

const mockCreate = vi.mocked(anthropic.messages.create);

const BASE_INPUT = {
  baseResume: "John Doe\nSoftware Engineer with 5 years experience.",
  jobTitle: "Senior Software Engineer",
  company: "Acme Corp",
  jobDescription: "We need a senior engineer with React and Node.js experience.",
};

const MOCK_RESPONSE = {
  content: [
    {
      type: "text" as const,
      text: "John Doe\nSenior Software Engineer tailored for Acme Corp.",
    },
  ],
  usage: {
    input_tokens: 100,
    output_tokens: 50,
  },
};

describe("tailorResume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(MOCK_RESPONSE as never);
  });

  it("returns tailored text and token count", async () => {
    const result = await tailorResume(BASE_INPUT);

    expect(result.tailoredText).toBe(
      "John Doe\nSenior Software Engineer tailored for Acme Corp."
    );
    expect(result.tokensUsed).toBe(150);
  });

  it("sums input and output tokens", async () => {
    mockCreate.mockResolvedValue({
      ...MOCK_RESPONSE,
      usage: { input_tokens: 200, output_tokens: 75 },
    } as never);

    const result = await tailorResume(BASE_INPUT);
    expect(result.tokensUsed).toBe(275);
  });

  it("trims whitespace from the response", async () => {
    mockCreate.mockResolvedValue({
      ...MOCK_RESPONSE,
      content: [{ type: "text" as const, text: "  trimmed  \n" }],
    } as never);

    const result = await tailorResume(BASE_INPUT);
    expect(result.tailoredText).toBe("trimmed");
  });

  it("includes job title and company in the prompt", async () => {
    await tailorResume(BASE_INPUT);

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0].content as string;
    expect(userMessage).toContain("Senior Software Engineer at Acme Corp");
  });

  it("omits company from prompt when not provided", async () => {
    await tailorResume({ ...BASE_INPUT, company: undefined });

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0].content as string;
    expect(userMessage).toContain("Senior Software Engineer");
    expect(userMessage).not.toContain(" at ");
  });

  it("throws when response content is not a text block", async () => {
    mockCreate.mockResolvedValue({
      ...MOCK_RESPONSE,
      content: [{ type: "tool_use" as const, id: "x", name: "test", input: {} }],
    } as never);

    await expect(tailorResume(BASE_INPUT)).rejects.toThrow(
      "Unexpected response type from Claude"
    );
  });

  it("uses claude-sonnet-4-6 model", async () => {
    await tailorResume(BASE_INPUT);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-4-6");
  });

  it("uses MODERATE intensity instructions by default", async () => {
    await tailorResume(BASE_INPUT);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("MODERATE");
  });

  it("uses MINIMAL intensity instructions for conservative", async () => {
    await tailorResume({ ...BASE_INPUT, intensity: "conservative" });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("MINIMAL");
  });

  it("uses AGGRESSIVE intensity instructions for aggressive", async () => {
    await tailorResume({ ...BASE_INPUT, intensity: "aggressive" });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("AGGRESSIVE");
  });
});
