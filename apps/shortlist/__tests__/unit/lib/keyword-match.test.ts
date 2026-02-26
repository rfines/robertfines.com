import { describe, it, expect } from "vitest";
import { computeKeywordMatch } from "@/lib/keyword-match";

describe("computeKeywordMatch", () => {
  it("returns 100% when all JD terms appear in tailored text", () => {
    // No stop words between meaningful terms so bigrams match as substrings
    const jd = "React TypeScript PostgreSQL developer";
    const tailored = "React TypeScript PostgreSQL developer";
    const result = computeKeywordMatch(jd, tailored);
    expect(result.score).toBe(100);
    expect(result.missing).toHaveLength(0);
  });

  it("returns low score when few JD terms appear in tailored text", () => {
    const jd = "Python machine learning tensorflow data science pipeline";
    const tailored = "Frontend developer with React and CSS skills.";
    const result = computeKeywordMatch(jd, tailored);
    expect(result.score).toBeLessThan(30);
  });

  it("filters stop words so they do not count as JD terms", () => {
    const jd = "the and or but a an in on at to for of with by is are was";
    const tailored = "completely different text";
    const result = computeKeywordMatch(jd, tailored);
    expect(result.total).toBe(0);
    expect(result.score).toBe(0);
  });

  it("score is an integer between 0 and 100", () => {
    const result = computeKeywordMatch(
      "React TypeScript Node.js PostgreSQL",
      "React developer"
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it("matched and missing arrays are sorted alphabetically", () => {
    const jd = "python javascript typescript react node";
    const tailored = "typescript react developer";
    const result = computeKeywordMatch(jd, tailored);
    expect(result.matched).toEqual([...result.matched].sort());
    expect(result.missing).toEqual([...result.missing].sort());
  });

  it("handles empty job description gracefully", () => {
    const result = computeKeywordMatch("", "Some tailored resume text");
    expect(result.score).toBe(0);
    expect(result.total).toBe(0);
    expect(result.matched).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });

  it("detects multi-word skill bigrams from the JD", () => {
    const jd =
      "experience with machine learning and computer vision required";
    const tailored =
      "worked on machine learning projects and computer vision pipelines";
    const result = computeKeywordMatch(jd, tailored);
    expect(result.matched).toContain("machine learning");
    expect(result.matched).toContain("computer vision");
  });

  it("partial match returns score between 0 and 100 with both matched and missing", () => {
    const jd = "React TypeScript Node.js PostgreSQL AWS Docker Kubernetes";
    const tailored = "React TypeScript developer with some experience";
    const result = computeKeywordMatch(jd, tailored);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.matched.length).toBeGreaterThan(0);
    expect(result.missing.length).toBeGreaterThan(0);
  });
});
