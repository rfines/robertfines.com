import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default async function TailoredResumesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const tailoredResumes = await prisma.tailoredResume.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      jobTitle: true,
      company: true,
      createdAt: true,
      resume: { select: { title: true } },
    },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Tailored Versions"
        description="AI-tailored resumes generated for specific job descriptions."
      />

      {tailoredResumes.length === 0 ? (
        <EmptyState
          title="No tailored resumes yet"
          description="Open a base resume and click 'Tailor for a job' to generate your first tailored version."
          action={{ label: "View resumes", href: "/dashboard/resumes" }}
        />
      ) : (
        <div className="space-y-3">
          {tailoredResumes.map((tr) => {
            const date = new Date(tr.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return (
              <Link key={tr.id} href={`/dashboard/tailored/${tr.id}`}>
                <Card className="hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                        <Sparkles size={16} className="text-[var(--accent)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {tr.jobTitle}
                          {tr.company ? ` — ${tr.company}` : ""}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          From &quot;{tr.resume.title}&quot; · {date}
                        </p>
                      </div>
                    </div>
                    <Badge variant="muted" className="shrink-0">
                      AI tailored
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
