import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface ResumeCardProps {
  resume: {
    id: string;
    title: string;
    fileType: string | null;
    updatedAt: Date;
  };
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const updatedAt = new Date(resume.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/dashboard/resumes/${resume.id}`}>
      <Card className="hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
              <FileText size={16} className="text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {resume.title}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Updated {updatedAt}
              </p>
            </div>
          </div>
          {resume.fileType && (
            <Badge variant="muted" className="shrink-0">
              {resume.fileType.toUpperCase()}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
