"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { Album } from "@/lib/albums";

export type AlbumFormat = Album["format"];

export type Filters = {
  formats: ReadonlySet<AlbumFormat>;
  genres: ReadonlySet<string>;
  minRating: number;
};

export type SortKey =
  | "artist-asc"
  | "title-asc"
  | "year-desc"
  | "year-asc"
  | "rating-desc";

const FORMATS: readonly AlbumFormat[] = [
  "vinyl",
  "cd",
  "cassette",
  "digital",
  "other",
];

export function filterAndSortAlbums(
  albums: Album[],
  filters: Filters,
  sort: SortKey,
): Album[] {
  let result = albums;

  if (filters.formats.size > 0) {
    result = result.filter((a) => filters.formats.has(a.format));
  }
  if (filters.genres.size > 0) {
    result = result.filter((a) => a.genre !== null && filters.genres.has(a.genre));
  }
  if (filters.minRating > 0) {
    result = result.filter((a) => a.rating !== null && a.rating >= filters.minRating);
  }

  const sorted = [...result];
  sorted.sort((a, b) => {
    switch (sort) {
      case "artist-asc":
        return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "year-desc":
        return compareNullableNumberDesc(a.year, b.year);
      case "year-asc":
        return compareNullableNumberAsc(a.year, b.year);
      case "rating-desc":
        return compareNullableNumberDesc(a.rating, b.rating);
    }
  });
  return sorted;
}

function compareNullableNumberDesc(a: number | null, b: number | null) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function compareNullableNumberAsc(a: number | null, b: number | null) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function toggle<T>(setter: Dispatch<SetStateAction<Set<T>>>, value: T) {
  setter((prev) => {
    const next = new Set(prev);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  });
}

function pillClass(active: boolean) {
  return `px-2 py-0.5 text-xs rounded border transition-colors ${
    active
      ? "bg-[var(--accent)] text-[var(--background)] border-[var(--accent)]"
      : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
  }`;
}

const selectClass =
  "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-xs px-2 py-1 rounded focus:outline-none focus:border-[var(--accent)]";

export function AlbumsList({ albums }: { albums: Album[] }) {
  const [formats, setFormats] = useState<Set<AlbumFormat>>(new Set());
  const [genres, setGenres] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>("artist-asc");

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    albums.forEach((a) => {
      if (a.genre) set.add(a.genre);
    });
    return Array.from(set).sort();
  }, [albums]);

  const visible = useMemo(
    () =>
      filterAndSortAlbums(
        albums,
        { formats, genres, minRating },
        sort,
      ),
    [albums, formats, genres, minRating, sort],
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-4 space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[var(--muted)] mr-1">$ format:</span>
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={formats.has(f)}
              onClick={() => toggle(setFormats, f)}
              className={pillClass(formats.has(f))}
            >
              {f}
            </button>
          ))}
        </div>

        {availableGenres.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--muted)] mr-1">$ genre:</span>
            {availableGenres.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={genres.has(g)}
                onClick={() => toggle(setGenres, g)}
                className={pillClass(genres.has(g))}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-[var(--muted)]">$ min rating:</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className={selectClass}
              aria-label="minimum rating"
            >
              <option value={0}>any</option>
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {"★".repeat(r)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-[var(--muted)]">$ sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={selectClass}
              aria-label="sort"
            >
              <option value="artist-asc">artist (A–Z)</option>
              <option value="title-asc">title (A–Z)</option>
              <option value="year-desc">year (newest)</option>
              <option value="year-asc">year (oldest)</option>
              <option value="rating-desc">rating (high–low)</option>
            </select>
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-[var(--muted)] text-sm">
          &gt; no albums match these filters.
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((album) => (
            <li key={album.id} className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[var(--muted)]">&gt;</span>
                <span className="text-[var(--foreground)] font-medium">
                  {album.title}
                </span>
                <span className="text-[var(--muted)] text-sm">
                  — {album.artist}
                </span>
              </div>
              <div className="pl-5 text-xs text-[var(--muted)] flex flex-wrap gap-x-2">
                {album.year !== null && <span>{album.year}</span>}
                {album.genre && <span>· {album.genre}</span>}
                <span>· {album.format}</span>
                {album.label && <span>· {album.label}</span>}
                {album.rating !== null && (
                  <span className="text-[var(--accent)]">
                    · {"★".repeat(album.rating)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
