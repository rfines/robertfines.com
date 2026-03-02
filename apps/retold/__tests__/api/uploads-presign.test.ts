import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/s3", () => ({
  generateS3Key: vi.fn(),
  createPresignedPutUrl: vi.fn(),
}));

import { POST } from "@/app/api/uploads/presign/route";
import { auth } from "@/lib/auth";
import { generateS3Key, createPresignedPutUrl } from "@/lib/s3";

const AUTHED_SESSION = {
  user: { id: "user_test123", email: "test@example.com" },
  expires: "2099-01-01",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/uploads/presign", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(generateS3Key).mockReturnValue("resumes/user_test123/uuid.pdf");
    vi.mocked(createPresignedPutUrl).mockResolvedValue(
      "https://s3.amazonaws.com/bucket/resumes/user_test123/uuid.pdf?sig=test"
    );
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeRequest({ filename: "r.pdf", contentType: "application/pdf" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid content type", async () => {
    const res = await POST(
      makeRequest({ filename: "resume.txt", contentType: "text/plain" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when filename is missing", async () => {
    const res = await POST(
      makeRequest({ contentType: "application/pdf" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with presignedUrl and s3Key for PDF", async () => {
    const res = await POST(
      makeRequest({ filename: "resume.pdf", contentType: "application/pdf" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.presignedUrl).toContain("s3.amazonaws.com");
    expect(data.s3Key).toBe("resumes/user_test123/uuid.pdf");
  });

  it("returns 200 with presignedUrl and s3Key for DOCX", async () => {
    vi.mocked(generateS3Key).mockReturnValue("resumes/user_test123/uuid.docx");

    const res = await POST(
      makeRequest({
        filename: "resume.docx",
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.s3Key).toBe("resumes/user_test123/uuid.docx");
  });

  it("generates S3 key with user's ID", async () => {
    await POST(
      makeRequest({ filename: "resume.pdf", contentType: "application/pdf" })
    );
    expect(generateS3Key).toHaveBeenCalledWith("user_test123", "resume.pdf");
  });
});
