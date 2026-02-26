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
