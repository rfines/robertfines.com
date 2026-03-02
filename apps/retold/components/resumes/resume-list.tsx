"use client";

import { ResumeCard } from "./resume-card";
import { EmptyState } from "@/components/shared/empty-state";
import { AnimatedList } from "@/components/shared/animated-list";
import { AnimatedItem } from "@/components/shared/animated-item";

interface ResumeListProps {
  resumes: {
    id: string;
    title: string;
    fileType: string | null;
    candidateName?: string | null;
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
    <AnimatedList>
      {resumes.map((resume) => (
        <AnimatedItem key={resume.id}>
          <ResumeCard resume={resume} />
        </AnimatedItem>
      ))}
    </AnimatedList>
  );
}
