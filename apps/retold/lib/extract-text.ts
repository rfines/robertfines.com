import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text.trim();
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

export async function extractText(
  buffer: Buffer,
  fileType: "pdf" | "docx"
): Promise<string> {
  if (fileType === "pdf") {
    return extractTextFromPdf(buffer);
  }
  return extractTextFromDocx(buffer);
}
