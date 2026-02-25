import { describe, it, expect } from "vitest";
import {
  createResumeSchema,
  updateResumeSchema,
  tailorResumeSchema,
  presignUploadSchema,
  uploadResumeFileSchema,
} from "@/types";

describe("createResumeSchema", () => {
  it("accepts valid input", () => {
    const result = createResumeSchema.safeParse({
      title: "My Resume",
      rawText: "Resume content here",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createResumeSchema.safeParse({
      title: "",
      rawText: "content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 100 characters", () => {
    const result = createResumeSchema.safeParse({
      title: "a".repeat(101),
      rawText: "content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty rawText", () => {
    const result = createResumeSchema.safeParse({
      title: "My Resume",
      rawText: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(createResumeSchema.safeParse({}).success).toBe(false);
    expect(createResumeSchema.safeParse({ title: "x" }).success).toBe(false);
  });
});

describe("updateResumeSchema", () => {
  it("accepts partial updates", () => {
    expect(
      updateResumeSchema.safeParse({ title: "New Title" }).success
    ).toBe(true);
    expect(
      updateResumeSchema.safeParse({ rawText: "New content" }).success
    ).toBe(true);
  });

  it("accepts empty object (no-op update)", () => {
    expect(updateResumeSchema.safeParse({}).success).toBe(true);
  });

  it("rejects empty string for title", () => {
    expect(updateResumeSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects empty string for rawText", () => {
    expect(updateResumeSchema.safeParse({ rawText: "" }).success).toBe(false);
  });
});

describe("tailorResumeSchema", () => {
  const VALID_CUID = "clxxxxxxxxxxxxxxxxxxxxxx";

  it("accepts valid input with company", () => {
    const result = tailorResumeSchema.safeParse({
      resumeId: VALID_CUID,
      jobTitle: "Senior Engineer",
      company: "Acme",
      jobDescription: "We need a senior engineer.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input without company", () => {
    const result = tailorResumeSchema.safeParse({
      resumeId: VALID_CUID,
      jobTitle: "Senior Engineer",
      jobDescription: "We need a senior engineer.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid resumeId (not a CUID)", () => {
    const result = tailorResumeSchema.safeParse({
      resumeId: "not-a-cuid!!!",
      jobTitle: "Engineer",
      jobDescription: "Description",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty jobTitle", () => {
    const result = tailorResumeSchema.safeParse({
      resumeId: VALID_CUID,
      jobTitle: "",
      jobDescription: "Description",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty jobDescription", () => {
    const result = tailorResumeSchema.safeParse({
      resumeId: VALID_CUID,
      jobTitle: "Engineer",
      jobDescription: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("presignUploadSchema", () => {
  it("accepts application/pdf", () => {
    const result = presignUploadSchema.safeParse({
      filename: "resume.pdf",
      contentType: "application/pdf",
    });
    expect(result.success).toBe(true);
  });

  it("accepts DOCX content type", () => {
    const result = presignUploadSchema.safeParse({
      filename: "resume.docx",
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unsupported content type", () => {
    const result = presignUploadSchema.safeParse({
      filename: "resume.txt",
      contentType: "text/plain",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing filename", () => {
    const result = presignUploadSchema.safeParse({
      contentType: "application/pdf",
    });
    expect(result.success).toBe(false);
  });
});

describe("uploadResumeFileSchema", () => {
  it("accepts pdf fileType", () => {
    expect(
      uploadResumeFileSchema.safeParse({ s3Key: "resumes/u1/file.pdf", fileType: "pdf" }).success
    ).toBe(true);
  });

  it("accepts docx fileType", () => {
    expect(
      uploadResumeFileSchema.safeParse({ s3Key: "resumes/u1/file.docx", fileType: "docx" }).success
    ).toBe(true);
  });

  it("rejects invalid fileType", () => {
    expect(
      uploadResumeFileSchema.safeParse({ s3Key: "resumes/u1/file.txt", fileType: "txt" }).success
    ).toBe(false);
  });

  it("rejects empty s3Key", () => {
    expect(
      uploadResumeFileSchema.safeParse({ s3Key: "", fileType: "pdf" }).success
    ).toBe(false);
  });
});
