import { PageHeader } from "@/components/shared/page-header";
import { ResumeForm } from "@/components/resumes/resume-form";

export default function NewResumePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Add Resume"
        description="Paste your resume text or upload a PDF / DOCX file."
      />
      <ResumeForm />
    </div>
  );
}
