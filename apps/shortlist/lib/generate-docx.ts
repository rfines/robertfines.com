import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

function parseResumeLines(text: string): Paragraph[] {
  const lines = text.split("\n");
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      // Blank line → small spacer
      paragraphs.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
      continue;
    }

    // Heuristic: all-caps short lines are likely section headers
    const isHeader =
      trimmed === trimmed.toUpperCase() &&
      trimmed.length < 50 &&
      !/[^A-Z\s\-/&]/.test(trimmed);

    if (isHeader) {
      paragraphs.push(
        new Paragraph({
          text: trimmed,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 80 },
          border: {
            bottom: { color: "000000", size: 6, style: "single", space: 4 },
          },
        })
      );
      continue;
    }

    // Bullet lines
    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("·")) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: trimmed.replace(/^[•\-·]\s*/, ""), size: 20 }),
          ],
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
        })
      );
      continue;
    }

    // Regular line
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: trimmed, size: 20 })],
        spacing: { before: 40, after: 40 },
        alignment: AlignmentType.LEFT,
      })
    );
  }

  return paragraphs;
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
        children: parseResumeLines(tailoredText),
      },
    ],
  });

  return Packer.toBuffer(doc);
}
