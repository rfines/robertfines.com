import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserPlan } from "@/lib/get-user-plan";
import { PageHeader } from "@/components/shared/page-header";
import { ResumeForm } from "@/components/resumes/resume-form";

export default async function NewResumePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const plan = await getUserPlan(session.user.id);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Add Resume"
        description="Paste your resume text or upload a PDF / DOCX file."
      />
      <ResumeForm plan={plan} />
    </div>
  );
}
