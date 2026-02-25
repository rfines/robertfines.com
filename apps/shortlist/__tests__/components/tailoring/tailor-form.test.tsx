import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TailorForm } from "@/components/tailoring/tailor-form";
import { useRouter } from "next/navigation";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("TailorForm", () => {
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

  function renderForm() {
    return render(
      <TailorForm resumeId="clxxxxxxxxxxxxxxxxxxxxxx" resumeTitle="My Resume" />
    );
  }

  it("shows the base resume title", () => {
    renderForm();
    expect(screen.getByText("My Resume")).toBeInTheDocument();
  });

  it("submit button is disabled when all fields are empty", () => {
    renderForm();
    expect(
      screen.getByRole("button", { name: /tailor resume/i })
    ).toBeDisabled();
  });

  it("submit button is disabled when only jobTitle is filled", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/job title/i), "Software Engineer");
    expect(
      screen.getByRole("button", { name: /tailor resume/i })
    ).toBeDisabled();
  });

  it("submit button is disabled when only jobDescription is filled", async () => {
    renderForm();
    await userEvent.type(
      screen.getByLabelText(/job description/i),
      "We need a great engineer."
    );
    expect(
      screen.getByRole("button", { name: /tailor resume/i })
    ).toBeDisabled();
  });

  it("submit button is enabled when both required fields are filled", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/job title/i), "Software Engineer");
    await userEvent.type(
      screen.getByLabelText(/job description/i),
      "We need a great engineer."
    );
    expect(
      screen.getByRole("button", { name: /tailor resume/i })
    ).toBeEnabled();
  });

  it("shows loading spinner and message while submitting", async () => {
    let resolveRequest!: (v: Response) => void;
    server.use(
      http.post("/api/tailor", () => {
        return new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        });
      })
    );

    renderForm();
    await userEvent.type(screen.getByLabelText(/job title/i), "Software Engineer");
    await userEvent.type(
      screen.getByLabelText(/job description/i),
      "We need a great engineer."
    );
    await userEvent.click(screen.getByRole("button", { name: /tailor resume/i }));

    expect(screen.queryByRole("button", { name: /tailor resume/i })).not.toBeInTheDocument();
    expect(screen.getByText(/generating tailored resume/i)).toBeInTheDocument();

    resolveRequest(
      new Response(
        JSON.stringify({ id: "t1", tailoredText: "Tailored content" }),
        { status: 201 }
      )
    );
  });

  it("navigates to tailored resume page on success", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/job title/i), "Software Engineer");
    await userEvent.type(
      screen.getByLabelText(/job description/i),
      "We need a great engineer."
    );
    await userEvent.click(screen.getByRole("button", { name: /tailor resume/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/tailored/t1");
    });
  });

  it("shows error message and re-enables button on API failure", async () => {
    server.use(
      http.post("/api/tailor", () => {
        return HttpResponse.json(
          { error: "Tailoring failed" },
          { status: 500 }
        );
      })
    );

    renderForm();
    await userEvent.type(screen.getByLabelText(/job title/i), "Software Engineer");
    await userEvent.type(
      screen.getByLabelText(/job description/i),
      "We need a great engineer."
    );
    await userEvent.click(screen.getByRole("button", { name: /tailor resume/i }));

    await waitFor(() => {
      expect(screen.getByText("Tailoring failed")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /tailor resume/i })
    ).toBeEnabled();
  });
});
