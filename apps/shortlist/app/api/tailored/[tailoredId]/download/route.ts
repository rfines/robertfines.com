import { prisma } from "@/lib/prisma";
import { generateDocx, generateCoverLetterDocx } from "@/lib/generate-docx";
import { generateMarkdown } from "@/lib/generate-markdown";
import { generatePdf, generateCoverLetterPdf } from "@/lib/generate-pdf";
import { NextResponse } from "next/server";
import { captureEvent } from "@/lib/posthog";
import { getUserPlan } from "@/lib/get-user-plan";
import { canDownload, canExportMarkdown, canExportPdf, canGenerateCoverLetter } from "@/lib/plan";
import { requireAuth } from "@/lib/route-helpers";

interface Params {
  params: Promise<{ tailoredId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "docx";

  if (!["docx", "md", "pdf", "cover-letter-docx", "cover-letter-pdf"].includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const plan = await getUserPlan(session.user.id);

  if (!canDownload(plan)) {
    return NextResponse.json(
      { error: "File downloads require a paid plan" },
      { status: 403 }
    );
  }

  if (format === "md" && !canExportMarkdown(plan)) {
    return NextResponse.json(
      { error: "Markdown export requires a paid plan" },
      { status: 403 }
    );
  }
  if (format === "pdf" && !canExportPdf(plan)) {
    return NextResponse.json(
      { error: "PDF export requires a Pro plan" },
      { status: 403 }
    );
  }
  if (format === "cover-letter-docx" && !canGenerateCoverLetter(plan)) {
    return NextResponse.json(
      { error: "Cover letter download requires a Starter plan" },
      { status: 403 }
    );
  }
  if (format === "cover-letter-pdf" && !canExportPdf(plan)) {
    return NextResponse.json(
      { error: "Cover letter PDF export requires a Pro plan" },
      { status: 403 }
    );
  }

  const { tailoredId } = await params;
  const tailoredResume = await prisma.tailoredResume.findFirst({
    where: { id: tailoredId, userId: session.user.id },
  });

  if (!tailoredResume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const slug = [tailoredResume.jobTitle, tailoredResume.company]
    .filter(Boolean)
    .join("_")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);

  await captureEvent(session.user.id, "resume_downloaded", { format });

  if (format === "cover-letter-docx" || format === "cover-letter-pdf") {
    if (!tailoredResume.coverLetterText) {
      return NextResponse.json(
        { error: "No cover letter has been generated for this resume" },
        { status: 404 }
      );
    }

    if (format === "cover-letter-pdf") {
      const pdfBuffer = await generateCoverLetterPdf(tailoredResume.coverLetterText);
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${slug}_Cover_Letter.pdf"`,
        },
      });
    }

    // cover-letter-docx
    const docxBuffer = await generateCoverLetterDocx(
      tailoredResume.coverLetterText,
      tailoredResume.jobTitle,
      tailoredResume.company
    );
    return new Response(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${slug}_Cover_Letter.docx"`,
      },
    });
  }

  if (format === "md") {
    const md = generateMarkdown(
      tailoredResume.tailoredText,
      tailoredResume.jobTitle,
      tailoredResume.company
    );
    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}_Resume.md"`,
      },
    });
  }

  if (format === "pdf") {
    const pdfBuffer = await generatePdf(tailoredResume.tailoredText);
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slug}_Resume.pdf"`,
      },
    });
  }

  // Default: docx
  const docxBuffer = await generateDocx(
    tailoredResume.tailoredText,
    tailoredResume.jobTitle,
    tailoredResume.company
  );

  return new Response(new Uint8Array(docxBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slug}_Resume.docx"`,
    },
  });
}
