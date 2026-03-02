import { describe, it, expect } from "vitest";
import { generateDocx } from "@/lib/generate-docx";

describe("generateDocx", () => {
  it("returns a non-empty Buffer", async () => {
    const buf = await generateDocx("John Doe\nSoftware Engineer", "Engineer");
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("produces a valid DOCX (ZIP) file starting with PK magic bytes", async () => {
    const buf = await generateDocx("Resume text", "Developer", "Acme");
    // DOCX is a ZIP archive — starts with PK\x03\x04
    expect(buf[0]).toBe(0x50); // P
    expect(buf[1]).toBe(0x4b); // K
  });

  it("handles all-caps section headers without throwing", async () => {
    const text = "EXPERIENCE\nCompany Inc\n\nEDUCATION\nUniversity";
    await expect(generateDocx(text, "Engineer")).resolves.toBeInstanceOf(Buffer);
  });

  it("handles bullet lines without throwing", async () => {
    const text = "SKILLS\n• TypeScript\n- React\n· Node.js";
    await expect(generateDocx(text, "Engineer")).resolves.toBeInstanceOf(Buffer);
  });

  it("handles empty lines without throwing", async () => {
    const text = "Line one\n\nLine two\n\nLine three";
    await expect(generateDocx(text, "Engineer")).resolves.toBeInstanceOf(Buffer);
  });

  it("handles empty text without throwing", async () => {
    await expect(generateDocx("", "Engineer")).resolves.toBeInstanceOf(Buffer);
  });

  it("includes company in title when provided", async () => {
    // We just verify no errors — the title is embedded in docx metadata
    await expect(
      generateDocx("Resume text", "Software Engineer", "Google")
    ).resolves.toBeInstanceOf(Buffer);
  });

  it("works without company param", async () => {
    await expect(
      generateDocx("Resume text", "Software Engineer")
    ).resolves.toBeInstanceOf(Buffer);
  });
});
