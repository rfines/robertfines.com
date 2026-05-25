import { describe, it, expect } from "vitest";
import { parseAllowlist, isAllowed } from "@/lib/auth-allowlist";

describe("parseAllowlist", () => {
  it("returns empty array for undefined", () => {
    expect(parseAllowlist(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseAllowlist("")).toEqual([]);
  });

  it("parses a single email", () => {
    expect(parseAllowlist("foo@example.com")).toEqual(["foo@example.com"]);
  });

  it("parses comma-separated emails and lowercases them", () => {
    expect(parseAllowlist("Foo@Example.com,BAR@example.com")).toEqual([
      "foo@example.com",
      "bar@example.com",
    ]);
  });

  it("trims whitespace around entries", () => {
    expect(parseAllowlist("  a@x.com , b@x.com  ")).toEqual([
      "a@x.com",
      "b@x.com",
    ]);
  });

  it("filters out empty entries from stray commas", () => {
    expect(parseAllowlist("a@x.com,,b@x.com,")).toEqual(["a@x.com", "b@x.com"]);
  });
});

describe("isAllowed", () => {
  const list = ["fines.robert@gmail.com", "friend@gmail.com"] as const;

  it("rejects null/undefined/empty emails", () => {
    expect(isAllowed(null, list)).toBe(false);
    expect(isAllowed(undefined, list)).toBe(false);
    expect(isAllowed("", list)).toBe(false);
  });

  it("rejects non-allowlisted emails", () => {
    expect(isAllowed("randomperson@gmail.com", list)).toBe(false);
  });

  it("accepts an allowlisted email", () => {
    expect(isAllowed("fines.robert@gmail.com", list)).toBe(true);
  });

  it("is case-insensitive on the input email", () => {
    expect(isAllowed("Fines.Robert@Gmail.com", list)).toBe(true);
  });

  it("returns false when the allowlist is empty", () => {
    expect(isAllowed("fines.robert@gmail.com", [])).toBe(false);
  });
});
