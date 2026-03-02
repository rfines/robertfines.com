/**
 * PDF generation using @react-pdf/renderer.
 *
 * This is the styling surface for Pro-tier resume exports. The ResumePdf
 * component is the visual template — future Pro variants can swap it out
 * for different designs (two-column, creative, etc.).
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { parseResumeLines } from "@/lib/parse-resume-lines";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    lineHeight: 1.45,
  },
  section: {
    marginBottom: 10,
  },
  header: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 0.75,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 2,
    marginBottom: 5,
    marginTop: 12,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 12,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
  },
  line: {
    marginBottom: 2,
  },
});

function ResumePdf({ text }: { text: string }) {
  const lines = parseResumeLines(text);

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      React.createElement(
        View,
        null,
        ...lines.map((line, i) => {
          if (line.type === "empty") {
            return React.createElement(View, { key: i, style: { height: 4 } });
          }
          if (line.type === "header") {
            return React.createElement(Text, { key: i, style: styles.header }, line.text);
          }
          if (line.type === "bullet") {
            return React.createElement(
              View,
              { key: i, style: styles.bullet },
              React.createElement(Text, { style: styles.bulletDot }, "•"),
              React.createElement(Text, { style: styles.bulletText }, line.text)
            );
          }
          return React.createElement(Text, { key: i, style: styles.line }, line.text);
        })
      )
    )
  );
}

const clStyles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 72, // 1" margins
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
    lineHeight: 1.6,
  },
  paragraph: {
    marginBottom: 12,
  },
});

function CoverLetterPdf({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: clStyles.page },
      ...paragraphs.map((para, i) =>
        React.createElement(Text, { key: i, style: clStyles.paragraph }, para)
      )
    )
  );
}

export async function generateCoverLetterPdf(coverLetterText: string): Promise<Buffer> {
  const element = React.createElement(CoverLetterPdf, { text: coverLetterText });
  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}

export async function generatePdf(tailoredText: string): Promise<Buffer> {
  const element = React.createElement(ResumePdf, { text: tailoredText });
  // @react-pdf/renderer uses its own React renderer; cast to satisfy its renderToBuffer types
  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}
