import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/resumes", () => {
    return HttpResponse.json([
      {
        id: "r1",
        title: "Software Engineer Resume",
        fileType: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ]);
  }),

  http.post("/api/resumes", async ({ request }) => {
    const body = (await request.json()) as { title: string; rawText: string };
    return HttpResponse.json(
      {
        id: "r1",
        userId: "u1",
        title: body.title,
        rawText: body.rawText,
        s3Key: null,
        fileType: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
      { status: 201 }
    );
  }),

  http.delete("/api/resumes/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/tailor", async ({ request }) => {
    const body = (await request.json()) as {
      resumeId: string;
      jobTitle: string;
      jobDescription: string;
      company?: string;
    };
    return HttpResponse.json(
      {
        id: "t1",
        userId: "u1",
        resumeId: body.resumeId,
        jobTitle: body.jobTitle,
        company: body.company ?? null,
        jobDescription: body.jobDescription,
        tailoredText: "Tailored resume content here.",
        tokensUsed: 1234,
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      { status: 201 }
    );
  }),

  http.post("/api/uploads/presign", () => {
    return HttpResponse.json({
      presignedUrl:
        "https://s3.amazonaws.com/bucket/resumes/u1/uuid.pdf?sig=test",
      s3Key: "resumes/u1/uuid.pdf",
    });
  }),

  http.post("/api/uploads/extract", () => {
    return HttpResponse.json({
      text: "Extracted resume content from file.",
    });
  }),

  http.post("/api/tailored/:tailoredId/cover-letter", () => {
    return HttpResponse.json({
      coverLetterText: "Dear Hiring Manager, I am excited to apply.",
      coverLetterTokensUsed: 300,
    });
  }),
];
