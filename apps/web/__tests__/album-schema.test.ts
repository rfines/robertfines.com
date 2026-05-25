import { describe, it, expect } from "vitest";
import { albumInputSchema } from "@/lib/album-schema";

function fd(fields: Record<string, string>) {
  return {
    title: "",
    artist: "",
    year: "",
    genre: "",
    format: "vinyl",
    label: "",
    coverImageUrl: "",
    rating: "",
    notes: "",
    ...fields,
  };
}

describe("albumInputSchema", () => {
  describe("required fields", () => {
    it("rejects missing title", () => {
      const result = albumInputSchema.safeParse(
        fd({ title: "", artist: "Joni" }),
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title?.[0]).toMatch(/required/i);
      }
    });

    it("rejects missing artist", () => {
      const result = albumInputSchema.safeParse(
        fd({ title: "Blue", artist: "" }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects an invalid format", () => {
      const result = albumInputSchema.safeParse(
        fd({ title: "Blue", artist: "Joni", format: "8track" }),
      );
      expect(result.success).toBe(false);
    });

    it("accepts the minimum valid input", () => {
      const result = albumInputSchema.safeParse(
        fd({ title: "Blue", artist: "Joni", format: "vinyl" }),
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          title: "Blue",
          artist: "Joni",
          format: "vinyl",
          year: null,
          genre: null,
          label: null,
          coverImageUrl: null,
          rating: null,
          notes: null,
        });
      }
    });
  });

  describe("year", () => {
    it.each([1800, 1959, 2026, 2100])("accepts %i", (year) => {
      const result = albumInputSchema.safeParse(
        fd({ title: "x", artist: "y", year: String(year) }),
      );
      expect(result.success).toBe(true);
    });

    it.each([1799, 2101, -1])("rejects %i", (year) => {
      const result = albumInputSchema.safeParse(
        fd({ title: "x", artist: "y", year: String(year) }),
      );
      expect(result.success).toBe(false);
    });

    it("accepts empty year as null", () => {
      const result = albumInputSchema.safeParse(
        fd({ title: "x", artist: "y", year: "" }),
      );
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.year).toBeNull();
    });
  });

  describe("rating", () => {
    it.each([1, 2, 3, 4, 5])("accepts %i", (rating) => {
      const result = albumInputSchema.safeParse(
        fd({ title: "x", artist: "y", rating: String(rating) }),
      );
      expect(result.success).toBe(true);
    });

    it.each([0, 6, 10, -1])("rejects %i", (rating) => {
      const result = albumInputSchema.safeParse(
        fd({ title: "x", artist: "y", rating: String(rating) }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe("coverImageUrl", () => {
    it("accepts http URLs", () => {
      const result = albumInputSchema.safeParse(
        fd({
          title: "x",
          artist: "y",
          coverImageUrl: "https://example.com/a.jpg",
        }),
      );
      expect(result.success).toBe(true);
    });

    it("rejects garbage strings", () => {
      const result = albumInputSchema.safeParse(
        fd({ title: "x", artist: "y", coverImageUrl: "not a url" }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects non-http(s) protocols", () => {
      const result = albumInputSchema.safeParse(
        fd({ title: "x", artist: "y", coverImageUrl: "javascript:alert(1)" }),
      );
      expect(result.success).toBe(false);
    });

    it("treats empty as null", () => {
      const result = albumInputSchema.safeParse(
        fd({ title: "x", artist: "y", coverImageUrl: "" }),
      );
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.coverImageUrl).toBeNull();
    });
  });

  it("trims whitespace from text fields", () => {
    const result = albumInputSchema.safeParse(
      fd({ title: "  Blue  ", artist: "  Joni  " }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Blue");
      expect(result.data.artist).toBe("Joni");
    }
  });
});
