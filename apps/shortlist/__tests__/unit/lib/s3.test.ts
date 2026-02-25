import { describe, it, expect } from "vitest";
import { generateS3Key } from "@/lib/s3";

describe("generateS3Key", () => {
  it("generates a key with the correct prefix", () => {
    const key = generateS3Key("user123", "resume.pdf");
    expect(key).toMatch(/^resumes\/user123\//);
  });

  it("preserves the file extension", () => {
    const pdfKey = generateS3Key("u1", "document.pdf");
    expect(pdfKey).toMatch(/\.pdf$/);

    const docxKey = generateS3Key("u1", "document.docx");
    expect(docxKey).toMatch(/\.docx$/);
  });

  it("uses lowercase extension", () => {
    const key = generateS3Key("u1", "resume.PDF");
    expect(key).toMatch(/\.pdf$/);
  });

  it("generates a UUID segment between prefix and extension", () => {
    const key = generateS3Key("u1", "resume.pdf");
    // format: resumes/{userId}/{uuid}.{ext}
    const uuidSegment = key.replace(/^resumes\/u1\//, "").replace(/\.pdf$/, "");
    expect(uuidSegment).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("generates unique keys on repeated calls", () => {
    const k1 = generateS3Key("u1", "resume.pdf");
    const k2 = generateS3Key("u1", "resume.pdf");
    expect(k1).not.toBe(k2);
  });

  it("uses the full filename as the extension when no dot is present", () => {
    // split(".").pop() on a dotless name returns the whole name, not undefined
    const key = generateS3Key("u1", "nodotfile");
    expect(key).toMatch(/\.nodotfile$/);
  });
});
