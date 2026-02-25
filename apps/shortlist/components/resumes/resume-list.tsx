import { ResumeCard } from "./resume-card";
import { EmptyState } from "@/components/shared/empty-state";

interface ResumeListProps {
  resumes: {
    id: string;
    title: string;
    fileType: string | null;
    updatedAt: Date;
  }[];
}

export function ResumeList({ resumes }: ResumeListProps) {
  if (resumes.length === 0) {
    return (
      <EmptyState
        title="No resumes yet"
        description="Add your first base resume to get started. You can paste text or upload a PDF or DOCX."
        action={{ label: "Add resume", href: "/dashboard/resumes/new" }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {resumes.map((resume) => (
        <ResumeCard key={resume.id} resume={resume} />
      ))}
    </div>
  );
}
