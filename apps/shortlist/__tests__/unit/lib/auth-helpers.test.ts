import { describe, it, expect } from "vitest";
import { isEmailAllowed } from "@/lib/auth-helpers";

describe("isEmailAllowed", () => {
  describe("open signup (empty allowlist)", () => {
    it("allows any valid email when allowedEmails is empty", () => {
      expect(isEmailAllowed("anyone@example.com", [])).toBe(true);
    });

    it("allows a brand new user email with empty allowedEmails", () => {
      expect(isEmailAllowed("newuser@domain.org", [])).toBe(true);
    });
  });

  describe("closed beta (non-empty allowlist)", () => {
    const allowed = ["admin@example.com", "user@example.com"];

    it("allows an email that is in the allowlist", () => {
      expect(isEmailAllowed("admin@example.com", allowed)).toBe(true);
    });

    it("allows a second email that is in the allowlist", () => {
      expect(isEmailAllowed("user@example.com", allowed)).toBe(true);
    });

    it("blocks an email that is not in the allowlist", () => {
      expect(isEmailAllowed("stranger@example.com", allowed)).toBe(false);
    });

    it("blocks a partial match (prefix only)", () => {
      expect(isEmailAllowed("admin", allowed)).toBe(false);
    });

    it("is case-sensitive — upper-cased email is rejected", () => {
      expect(isEmailAllowed("Admin@example.com", allowed)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns false for empty string email with empty allowlist", () => {
      expect(isEmailAllowed("", [])).toBe(false);
    });

    it("returns false for empty string email with non-empty allowlist", () => {
      expect(isEmailAllowed("", ["a@b.com"])).toBe(false);
    });

    it("allows any email when allowlist has one wildcard-style entry (exact match required)", () => {
      // Confirms exact-match semantics: "all@domain.com" does NOT match "other@domain.com"
      expect(isEmailAllowed("other@domain.com", ["all@domain.com"])).toBe(false);
    });
  });
});
