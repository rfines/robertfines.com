import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/s3", () => ({
  getObjectBuffer: vi.fn(),
}));

vi.mock("@/lib/extract-text", () => ({
  extractText: vi.fn(),
}));

import { POST } from "@/app/api/uploads/extract/route";
import { auth } from "@/lib/auth";
import { getObjectBuffer } from "@/lib/s3";
import { extractText } from "@/lib/extract-text";

const AUTHED_SESSION = {
  user: { id: "user_test123", email: "test@example.com" },
  expires: "2099-01-01",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/uploads/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/uploads/extract", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(AUTHED_SESSION as never);
    vi.mocked(getObjectBuffer).mockResolvedValue(Buffer.from("file data"));
    vi.mocked(extractText).mockResolvedValue("Extracted resume text");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(
      makeRequest({ s3Key: "resumes/user_test123/file.pdf", fileType: "pdf" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing s3Key", async () => {
    const res = await POST(makeRequest({ fileType: "pdf" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid fileType", async () => {
    const res = await POST(
      makeRequest({ s3Key: "resumes/user_test123/file.txt", fileType: "txt" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when s3Key does not start with user's prefix", async () => {
    const res = await POST(
      makeRequest({ s3Key: "resumes/other_user/file.pdf", fileType: "pdf" })
    );
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Forbidden");
  });

  it("returns 200 with extracted text for PDF", async () => {
    const res = await POST(
      makeRequest({ s3Key: "resumes/user_test123/file.pdf", fileType: "pdf" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.text).toBe("Extracted resume text");
  });

  it("returns 200 with extracted text for DOCX", async () => {
    const res = await POST(
      makeRequest({ s3Key: "resumes/user_test123/file.docx", fileType: "docx" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.text).toBe("Extracted resume text");
  });

  it("fetches the file from S3 and extracts text with correct fileType", async () => {
    const s3Key = "resumes/user_test123/file.pdf";
    await POST(makeRequest({ s3Key, fileType: "pdf" }));

    expect(getObjectBuffer).toHaveBeenCalledWith(s3Key);
    expect(extractText).toHaveBeenCalledWith(expect.any(Buffer), "pdf");
  });
});
