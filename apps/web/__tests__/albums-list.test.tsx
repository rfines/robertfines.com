import { describe, it, expect } from "vitest";
import {
  filterAndSortAlbums,
  type AlbumFormat,
  type SortKey,
} from "@/app/hobbies/albums/_components/albums-list";
import type { Album } from "@/lib/albums";

function makeAlbum(overrides: Partial<Album> & { id: string }): Album {
  return {
    title: "Title",
    artist: "Artist",
    year: 2000,
    genre: "Rock",
    format: "vinyl",
    label: null,
    coverImageUrl: null,
    rating: null,
    notes: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  } as Album;
}

const emptyFilters = {
  formats: new Set<AlbumFormat>(),
  genres: new Set<string>(),
  minRating: 0,
};

describe("filterAndSortAlbums", () => {
  describe("filtering", () => {
    it("filters by format when one or more formats selected", () => {
      const albums = [
        makeAlbum({ id: "a", format: "vinyl" }),
        makeAlbum({ id: "b", format: "cd" }),
        makeAlbum({ id: "c", format: "digital" }),
      ];
      const result = filterAndSortAlbums(
        albums,
        { ...emptyFilters, formats: new Set<AlbumFormat>(["vinyl", "digital"]) },
        "artist-asc",
      );
      expect(result.map((a) => a.id).sort()).toEqual(["a", "c"]);
    });

    it("filters by genre", () => {
      const albums = [
        makeAlbum({ id: "a", genre: "Rock" }),
        makeAlbum({ id: "b", genre: "Jazz" }),
        makeAlbum({ id: "c", genre: null }),
      ];
      const result = filterAndSortAlbums(
        albums,
        { ...emptyFilters, genres: new Set(["Jazz"]) },
        "artist-asc",
      );
      expect(result.map((a) => a.id)).toEqual(["b"]);
    });

    it("filters by minRating, excluding albums with null rating", () => {
      const albums = [
        makeAlbum({ id: "a", rating: 5 }),
        makeAlbum({ id: "b", rating: 3 }),
        makeAlbum({ id: "c", rating: null }),
      ];
      const result = filterAndSortAlbums(
        albums,
        { ...emptyFilters, minRating: 4 },
        "artist-asc",
      );
      expect(result.map((a) => a.id)).toEqual(["a"]);
    });

    it("returns all albums when no filters are set", () => {
      const albums = [
        makeAlbum({ id: "a" }),
        makeAlbum({ id: "b" }),
      ];
      const result = filterAndSortAlbums(albums, emptyFilters, "artist-asc");
      expect(result).toHaveLength(2);
    });
  });

  describe("sorting", () => {
    const albums: Album[] = [
      makeAlbum({ id: "a", artist: "Radiohead", title: "OK Computer", year: 1997, rating: 5 }),
      makeAlbum({ id: "b", artist: "Joni Mitchell", title: "Blue", year: 1971, rating: 4 }),
      makeAlbum({ id: "c", artist: "Miles Davis", title: "Kind of Blue", year: 1959, rating: 5 }),
      makeAlbum({ id: "d", artist: "No Year", title: "Untitled", year: null, rating: null }),
    ];

    it.each<[SortKey, string[]]>([
      ["artist-asc", ["b", "c", "d", "a"]],
      ["title-asc", ["b", "c", "a", "d"]],
    ])("sorts by %s correctly", (sort, expectedOrder) => {
      const result = filterAndSortAlbums(albums, emptyFilters, sort);
      expect(result.map((a) => a.id)).toEqual(expectedOrder);
    });

    it("sorts year descending, pushing nulls to the end", () => {
      const result = filterAndSortAlbums(albums, emptyFilters, "year-desc");
      expect(result.map((a) => a.id)).toEqual(["a", "b", "c", "d"]);
    });

    it("sorts year ascending, pushing nulls to the end", () => {
      const result = filterAndSortAlbums(albums, emptyFilters, "year-asc");
      expect(result.map((a) => a.id)).toEqual(["c", "b", "a", "d"]);
    });

    it("sorts rating desc, pushing nulls to the end", () => {
      const result = filterAndSortAlbums(albums, emptyFilters, "rating-desc");
      // a and c both rating=5; tie-breaker is original order
      const ids = result.map((a) => a.id);
      expect(ids[ids.length - 1]).toBe("d");
      expect(ids.slice(0, 2).sort()).toEqual(["a", "c"]);
      expect(ids[2]).toBe("b");
    });
  });
});
