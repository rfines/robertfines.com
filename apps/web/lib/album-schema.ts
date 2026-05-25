import { z } from "zod";

export const ALBUM_FORMATS = [
  "vinyl",
  "cd",
  "cassette",
  "digital",
  "other",
] as const;

export type AlbumFormatLiteral = (typeof ALBUM_FORMATS)[number];

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((s) => (s.length === 0 ? null : s))
  .nullable();

const optionalUrl = z
  .string()
  .trim()
  .transform((s) => (s.length === 0 ? null : s))
  .nullable()
  .refine(
    (v) => {
      if (v === null) return true;
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Must be a valid http(s) URL" },
  );

const optionalInt = z
  .string()
  .trim()
  .transform((s) => (s.length === 0 ? null : Number(s)))
  .pipe(
    z
      .number()
      .int("Must be a whole number")
      .nullable()
      .or(z.nan().transform(() => null as null)),
  )
  .nullable();

export const albumInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  artist: z.string().trim().min(1, "Artist is required").max(200),
  year: optionalInt.refine(
    (v) => v === null || (v >= 1800 && v <= 2100),
    { message: "Year must be between 1800 and 2100" },
  ),
  genre: optionalTrimmedString.pipe(
    z.string().max(100).nullable(),
  ),
  format: z.enum(ALBUM_FORMATS),
  label: optionalTrimmedString.pipe(
    z.string().max(200).nullable(),
  ),
  coverImageUrl: optionalUrl,
  rating: optionalInt.refine(
    (v) => v === null || (v >= 1 && v <= 5),
    { message: "Rating must be between 1 and 5" },
  ),
  notes: optionalTrimmedString.pipe(
    z.string().max(5000).nullable(),
  ),
});

export type AlbumInput = z.infer<typeof albumInputSchema>;
