import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { parseResumeLines } from "@/lib/parse-resume-lines";

function toParagraphs(text: string): Paragraph[] {
  return parseResumeLines(text).map((line) => {
    if (line.type === "empty") {
      return new Paragraph({ spacing: { before: 80, after: 80 } });
    }

    if (line.type === "header") {
      return new Paragraph({
        text: line.text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
        border: {
          bottom: { color: "000000", size: 6, style: "single", space: 4 },
        },
      });
    }

    if (line.type === "bullet") {
      return new Paragraph({
        children: [new TextRun({ text: line.text, size: 20 })],
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 },
      });
    }

    // text
    return new Paragraph({
      children: [new TextRun({ text: line.text, size: 20 })],
      spacing: { before: 40, after: 40 },
      alignment: AlignmentType.LEFT,
    });
  });
}

export async function generateCoverLetterDocx(
  coverLetterText: string,
  jobTitle: string,
  company?: string | null
): Promise<Buffer> {
  const title = company
    ? `${jobTitle} — ${company} Cover Letter`
    : `${jobTitle} Cover Letter`;

  // Cover letters are plain prose — split on blank lines into paragraphs
  const paragraphs = coverLetterText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (para) =>
        new Paragraph({
          children: [new TextRun({ text: para, size: 22 })], // 11pt
          spacing: { before: 0, after: 200 },
        })
    );

  const doc = new Document({
    creator: "Shortlist",
    title,
    sections: [
      {
        properties: {
          page: {
            // 1" margins — standard for cover letters
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function generateDocx(
  tailoredText: string,
  jobTitle: string,
  company?: string | null
): Promise<Buffer> {
  const title = company ? `${jobTitle} — ${company}` : jobTitle;

  const doc = new Document({
    creator: "Shortlist",
    title,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: toParagraphs(tailoredText),
      },
    ],
  });

  return Packer.toBuffer(doc);
}
