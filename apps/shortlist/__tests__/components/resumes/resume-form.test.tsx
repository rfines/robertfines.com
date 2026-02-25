import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResumeForm } from "@/components/resumes/resume-form";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("ResumeForm (text mode)", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as never);
  });

  it("renders title input and mode tabs", () => {
    render(<ResumeForm />);
    expect(screen.getByLabelText(/resume title/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /paste text/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload file/i })).toBeInTheDocument();
  });

  it("shows textarea in text mode by default", () => {
    render(<ResumeForm />);
    expect(screen.getByLabelText(/resume content/i)).toBeInTheDocument();
  });

  it("submit button is disabled when title and content are empty", () => {
    render(<ResumeForm />);
    expect(screen.getByRole("button", { name: /save resume/i })).toBeDisabled();
  });

  it("submit button is disabled when only title is filled", async () => {
    render(<ResumeForm />);
    await userEvent.type(screen.getByLabelText(/resume title/i), "My Resume");
    expect(screen.getByRole("button", { name: /save resume/i })).toBeDisabled();
  });

  it("submit button is enabled when both title and content are filled", async () => {
    render(<ResumeForm />);
    await userEvent.type(screen.getByLabelText(/resume title/i), "My Resume");
    await userEvent.type(
      screen.getByLabelText(/resume content/i),
      "Resume text here"
    );
    expect(screen.getByRole("button", { name: /save resume/i })).toBeEnabled();
  });

  it("navigates to resume detail page on successful submission", async () => {
    render(<ResumeForm />);
    await userEvent.type(screen.getByLabelText(/resume title/i), "My Resume");
    await userEvent.type(
      screen.getByLabelText(/resume content/i),
      "Resume text here"
    );
    await userEvent.click(screen.getByRole("button", { name: /save resume/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/resumes/r1");
    });
  });

  it("shows Saving… while submitting", async () => {
    let resolveCreate!: (v: Response) => void;
    const createPromise = new Promise<Response>((resolve) => {
      resolveCreate = resolve;
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockReturnValueOnce(createPromise);

    render(<ResumeForm />);
    await userEvent.type(screen.getByLabelText(/resume title/i), "My Resume");
    await userEvent.type(
      screen.getByLabelText(/resume content/i),
      "Resume text"
    );
    await userEvent.click(screen.getByRole("button", { name: /save resume/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();

    resolveCreate(
      new Response(
        JSON.stringify({
          id: "r1",
          title: "My Resume",
          rawText: "Resume text",
        }),
        { status: 201 }
      )
    );
    fetchSpy.mockRestore();
  });

  it("shows error message on API failure", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Server error" }), { status: 500 })
      );

    render(<ResumeForm />);
    await userEvent.type(screen.getByLabelText(/resume title/i), "My Resume");
    await userEvent.type(
      screen.getByLabelText(/resume content/i),
      "Resume text"
    );
    await userEvent.click(screen.getByRole("button", { name: /save resume/i }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });

    fetchSpy.mockRestore();
  });
});
