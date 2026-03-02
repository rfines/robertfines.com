import { describe, it, expect } from "vitest";
import { analyzeAtsWarnings } from "@/lib/ats-warnings";

const CLEAN_RESUME = `
John Doe
Software Engineer

Experience
Senior Engineer at Acme Corp, 2020-2024
- Built scalable APIs using Node.js and TypeScript
- Led team of 5 engineers

Education
B.S. Computer Science, State University, 2019

Skills
TypeScript, React, Node.js, PostgreSQL
`;

describe("analyzeAtsWarnings", () => {
  it("returns no warnings for a clean resume", () => {
    const warnings = analyzeAtsWarnings(CLEAN_RESUME);
    expect(warnings).toHaveLength(0);
  });

  it("detects table-like content with 2+ pipe characters per line", () => {
    const text = CLEAN_RESUME + "\n| Column A | Column B | Column C |";
    const warnings = analyzeAtsWarnings(text);
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain("table-detected");
  });

  it("does not flag a line with a single pipe as a table", () => {
    const text = CLEAN_RESUME + "\nSome text | with one pipe";
    const warnings = analyzeAtsWarnings(text);
    const codes = warnings.map((w) => w.code);
    expect(codes).not.toContain("table-detected");
  });

  it("detects fancy bullet characters", () => {
    const text = CLEAN_RESUME + "\n▪ Built something cool\n▸ Deployed to AWS";
    const warnings = analyzeAtsWarnings(text);
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain("fancy-bullets");
  });

  it("detects decorative separator lines of 10+ repeated chars", () => {
    const text = CLEAN_RESUME + "\n====================\n";
    const warnings = analyzeAtsWarnings(text);
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain("decorative-separators");
  });

  it("does not flag a short repeated-char sequence as a separator", () => {
    const text = CLEAN_RESUME + "\n---\n";
    const warnings = analyzeAtsWarnings(text);
    const codes = warnings.map((w) => w.code);
    expect(codes).not.toContain("decorative-separators");
  });

  it("detects missing standard sections", () => {
    const text = "John Doe\nSoftware Engineer\nBuilt things.";
    const warnings = analyzeAtsWarnings(text);
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain("missing-sections");
  });

  it("does not flag missing sections when all three are present", () => {
    const warnings = analyzeAtsWarnings(CLEAN_RESUME);
    const codes = warnings.map((w) => w.code);
    expect(codes).not.toContain("missing-sections");
  });

  it("detects lines longer than 120 characters", () => {
    const longLine = "A".repeat(121);
    const text = CLEAN_RESUME + "\n" + longLine;
    const warnings = analyzeAtsWarnings(text);
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain("long-lines");
  });

  it("does not flag a line of exactly 120 characters as too long", () => {
    const exactLine = "A".repeat(120);
    const text = CLEAN_RESUME + "\n" + exactLine;
    const warnings = analyzeAtsWarnings(text);
    const codes = warnings.map((w) => w.code);
    expect(codes).not.toContain("long-lines");
  });

  it("table-detected has error severity; others have warning severity", () => {
    const text =
      CLEAN_RESUME +
      "\n| A | B | C |\n▪ Bullet\n====================\n" +
      "A".repeat(125);
    const warnings = analyzeAtsWarnings(text);
    const tableWarning = warnings.find((w) => w.code === "table-detected");
    expect(tableWarning?.severity).toBe("error");
    warnings
      .filter((w) => w.code !== "table-detected")
      .forEach((w) => expect(w.severity).toBe("warning"));
  });

  it("returns multiple warnings for a problematic resume", () => {
    const messy =
      "| Col1 | Col2 | Col3 |\n▪ Bullet point\n====================\n" +
      "A".repeat(130);
    const warnings = analyzeAtsWarnings(messy);
    expect(warnings.length).toBeGreaterThanOrEqual(4);
  });
});
