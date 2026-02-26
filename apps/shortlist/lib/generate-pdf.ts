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

interface LineBlock {
  type: "header" | "bullet" | "line" | "spacer";
  text: string;
}

function parseLines(text: string): LineBlock[] {
  return text.split("\n").map((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return { type: "spacer", text: "" };

    const isHeader =
      trimmed === trimmed.toUpperCase() &&
      trimmed.length < 50 &&
      !/[^A-Z\s\-/&]/.test(trimmed);

    if (isHeader) return { type: "header", text: trimmed };

    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("·")) {
      return { type: "bullet", text: trimmed.replace(/^[•\-·]\s*/, "") };
    }

    return { type: "line", text: trimmed };
  });
}

function ResumePdf({ text }: { text: string }) {
  const blocks = parseLines(text);

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      React.createElement(
        View,
        null,
        ...blocks.map((block, i) => {
          if (block.type === "spacer") {
            return React.createElement(View, { key: i, style: { height: 4 } });
          }
          if (block.type === "header") {
            return React.createElement(Text, { key: i, style: styles.header }, block.text);
          }
          if (block.type === "bullet") {
            return React.createElement(
              View,
              { key: i, style: styles.bullet },
              React.createElement(Text, { style: styles.bulletDot }, "•"),
              React.createElement(Text, { style: styles.bulletText }, block.text)
            );
          }
          return React.createElement(Text, { key: i, style: styles.line }, block.text);
        })
      )
    )
  );
}

export async function generatePdf(tailoredText: string): Promise<Buffer> {
  const element = React.createElement(ResumePdf, { text: tailoredText });
  return renderToBuffer(element);
}
