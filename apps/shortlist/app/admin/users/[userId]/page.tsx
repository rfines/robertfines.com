import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminUserActions, ReprocessButton } from "@/components/admin/admin-user-actions";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  await requireAdmin();

  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      resumes: { orderBy: { updatedAt: "desc" } },
      tailoredResumes: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!user) notFound();

  const totalTokens = user.tailoredResumes.reduce(
    (sum, t) => sum + (t.tokensUsed ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <ArrowLeft size={12} />
          All users
        </Link>

        {/* User profile */}
        <div className="flex items-start gap-4">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name ?? "Avatar"}
              width={48}
              height={48}
              className="rounded-full shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-[var(--foreground)] truncate">
                {user.name ?? user.email ?? user.id}
              </h1>
              <Badge variant="muted" className="capitalize shrink-0">
                {user.plan}
              </Badge>
              {user.role === "admin" && (
                <Badge variant="default" className="shrink-0">
                  Admin
                </Badge>
              )}
            </div>
            {user.name && (
              <p className="text-sm text-[var(--muted)]">{user.email}</p>
            )}
            <p className="text-xs text-[var(--muted)] mt-1">
              Joined{" "}
              {user.createdAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {" · "}
              {user.resumes.length} resume{user.resumes.length !== 1 ? "s" : ""}
              {" · "}
              {user.tailoredResumes.length} tailored
              {" · "}
              {totalTokens.toLocaleString()} tokens
            </p>
          </div>
        </div>
      </div>

      {/* Plan + role actions */}
      <AdminUserActions
        userId={user.id}
        plan={user.plan}
        role={user.role}
        monthlyRunLimit={user.monthlyRunLimit}
      />

      {/* Resumes */}
      {user.resumes.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[var(--foreground)] mb-3">
            Resumes ({user.resumes.length})
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">Title</th>
                  <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {user.resumes.map((resume) => (
                  <tr key={resume.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2.5 text-[var(--foreground)]">{resume.title}</td>
                    <td className="px-4 py-2.5 text-[var(--muted)]">
                      {resume.updatedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tailored resumes */}
      {user.tailoredResumes.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[var(--foreground)] mb-3">
            Tailored Resumes ({user.tailoredResumes.length})
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">Job</th>
                  <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">Intensity</th>
                  <th className="text-right px-4 py-2.5 text-[var(--muted)] font-medium">Tokens</th>
                  <th className="text-left px-4 py-2.5 text-[var(--muted)] font-medium">Date</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {user.tailoredResumes.map((t) => (
                  <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2.5 text-[var(--foreground)]">
                      {t.jobTitle}
                      {t.company && (
                        <span className="text-[var(--muted)]"> — {t.company}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {t.intensity && (
                        <Badge variant="muted" className="capitalize">
                          {t.intensity}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[var(--muted)]">
                      {t.tokensUsed?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--muted)]">
                      {t.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <ReprocessButton userId={user.id} tailoredId={t.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
