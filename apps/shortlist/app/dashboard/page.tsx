import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRunUsage } from "@/lib/get-run-usage";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Plus, Zap } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const [resumeCount, tailoredCount, usage] = await Promise.all([
    prisma.resume.count({ where: { userId: session.user.id } }),
    prisma.tailoredResume.count({ where: { userId: session.user.id } }),
    getRunUsage(session.user.id),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Tailor your resume to any job description in seconds.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/resumes">
          <Card className="hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                <FileText size={18} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {resumeCount}
                </p>
                <p className="text-xs text-[var(--muted)]">Base Resumes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/tailored">
          <Card className="hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                <Sparkles size={18} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {tailoredCount}
                </p>
                <p className="text-xs text-[var(--muted)]">Tailored Versions</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {usage.limit !== null && (
          <Link href="/dashboard/billing" className="col-span-2">
            <Card className="hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                  <Zap size={18} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {usage.remaining}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {usage.used} / {usage.limit} used
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-xs text-[var(--muted)]">Runs left this month</p>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--border)] mt-2">
                    <div
                      className="h-1 rounded-full bg-[var(--accent)] transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((usage.used / usage.limit) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      <div>
        <p className="text-sm text-[var(--muted)] mb-3">Quick actions</p>
        <div className="flex gap-3 flex-wrap">
          <Link href="/dashboard/resumes/new">
            <Button size="sm">
              <Plus size={14} />
              Add Resume
            </Button>
          </Link>
          {resumeCount > 0 && (
            <Link href="/dashboard/resumes">
              <Button variant="outline" size="sm">
                Tailor a Resume
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
