import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ResumeList } from "@/components/resumes/resume-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ResumesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      fileType: true,
      candidateName: true,
      updatedAt: true,
    },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="My Resumes"
        description="Your base resumes. Pick one to tailor it to a specific job."
        action={
          <Link href="/dashboard/resumes/new">
            <Button size="sm">
              <Plus size={14} />
              Add Resume
            </Button>
          </Link>
        }
      />
      <ResumeList resumes={resumes} />
    </div>
  );
}
