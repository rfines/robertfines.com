import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdmin();

  const { q = "", page: pageParam = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10));
  const take = 50;
  const skip = (page - 1) * take;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        role: true,
        createdAt: true,
        _count: { select: { resumes: true, tailoredResumes: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Users
          <span className="ml-2 text-sm font-normal text-[var(--muted)]">
            {total.toLocaleString()} total
          </span>
        </h1>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by email or name…"
            className="pl-8"
          />
        </div>
        <Button type="submit" size="sm">
          Search
        </Button>
        {q && (
          <Link href="/admin/users">
            <Button type="button" size="sm" variant="outline">
              Clear
            </Button>
          </Link>
        )}
      </form>

      {/* Users table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">User</th>
              <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">Plan</th>
              <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">Resumes</th>
              <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">Tailored</th>
              <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] transition-colors"
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors font-medium"
                  >
                    {user.name ?? user.email ?? user.id}
                  </Link>
                  {user.name && (
                    <p className="text-[var(--muted)]">{user.email}</p>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="muted" className="capitalize">
                      {user.plan}
                    </Badge>
                    {user.role === "admin" && (
                      <Badge variant="default" className="text-[10px]">
                        Admin
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[var(--muted)]">
                  {user._count.resumes}
                </td>
                <td className="px-4 py-2.5 text-[var(--muted)]">
                  {user._count.tailoredResumes}
                </td>
                <td className="px-4 py-2.5 text-[var(--muted)]">
                  {user.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-[var(--muted)]"
                >
                  {q ? `No users matching "${q}"` : "No users yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-xs">
          {page > 1 && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(q && { q }), page: String(page - 1) })}`}
            >
              <Button size="sm" variant="outline">
                ← Prev
              </Button>
            </Link>
          )}
          <span className="text-[var(--muted)]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(q && { q }), page: String(page + 1) })}`}
            >
              <Button size="sm" variant="outline">
                Next →
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
