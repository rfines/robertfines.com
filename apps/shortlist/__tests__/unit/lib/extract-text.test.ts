import { vi, describe, it, expect } from "vitest";

vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

import { extractText, extractTextFromPdf, extractTextFromDocx } from "@/lib/extract-text";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const mockPdfParse = vi.mocked(pdfParse);
const mockMammoth = vi.mocked(mammoth.extractRawText);

describe("extractTextFromPdf", () => {
  it("returns trimmed text from PDF buffer", async () => {
    mockPdfParse.mockResolvedValue({ text: "  Resume text  \n" } as never);

    const result = await extractTextFromPdf(Buffer.from("fake pdf"));
    expect(result).toBe("Resume text");
  });

  it("passes buffer to pdf-parse", async () => {
    mockPdfParse.mockResolvedValue({ text: "text" } as never);
    const buf = Buffer.from("pdf bytes");

    await extractTextFromPdf(buf);
    expect(mockPdfParse).toHaveBeenCalledWith(buf);
  });
});

describe("extractTextFromDocx", () => {
  it("returns trimmed text from DOCX buffer", async () => {
    mockMammoth.mockResolvedValue({ value: "  Docx content  \n", messages: [] });

    const result = await extractTextFromDocx(Buffer.from("fake docx"));
    expect(result).toBe("Docx content");
  });

  it("passes buffer to mammoth in the expected shape", async () => {
    mockMammoth.mockResolvedValue({ value: "text", messages: [] });
    const buf = Buffer.from("docx bytes");

    await extractTextFromDocx(buf);
    expect(mockMammoth).toHaveBeenCalledWith({ buffer: buf });
  });
});

describe("extractText (dispatcher)", () => {
  it("calls extractTextFromPdf for pdf fileType", async () => {
    mockPdfParse.mockResolvedValue({ text: "pdf content" } as never);

    const result = await extractText(Buffer.from("pdf"), "pdf");
    expect(result).toBe("pdf content");
  });

  it("calls extractTextFromDocx for docx fileType", async () => {
    mockMammoth.mockResolvedValue({ value: "docx content", messages: [] });

    const result = await extractText(Buffer.from("docx"), "docx");
    expect(result).toBe("docx content");
  });
});
