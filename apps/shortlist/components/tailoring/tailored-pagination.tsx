"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

interface TailoredPaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function TailoredPagination({ page, pageSize, total }: TailoredPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  function buildHref(nextPage: number, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    return `${pathname}?${params.toString()}`;
  }

  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(buildHref(1, Number(e.target.value)));
  }

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-[var(--muted)]">
        {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label htmlFor="page-size" className="text-xs text-[var(--muted)]">
            Per page
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={page > 1 ? buildHref(page - 1) : undefined}
            aria-disabled={page <= 1}
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors",
              page > 1
                ? "hover:border-[var(--accent)] hover:text-[var(--accent)]"
                : "opacity-40 pointer-events-none"
            )}
          >
            <ChevronLeft size={14} />
          </a>
          <span className="text-xs text-[var(--muted)] px-1 tabular-nums">
            {page} / {totalPages}
          </span>
          <a
            href={page < totalPages ? buildHref(page + 1) : undefined}
            aria-disabled={page >= totalPages}
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors",
              page < totalPages
                ? "hover:border-[var(--accent)] hover:text-[var(--accent)]"
                : "opacity-40 pointer-events-none"
            )}
          >
            <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
