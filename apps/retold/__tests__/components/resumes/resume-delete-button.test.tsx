import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResumeDeleteButton } from "@/components/resumes/resume-delete-button";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("ResumeDeleteButton", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as never);
  });

  it("shows only the trash button initially", () => {
    render(<ResumeDeleteButton resumeId="r1" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /yes, delete/i })).not.toBeInTheDocument();
  });

  it("shows confirmation UI after clicking the trash button", async () => {
    render(<ResumeDeleteButton resumeId="r1" />);
    await userEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Delete?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /yes, delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("returns to initial state after clicking Cancel", async () => {
    render(<ResumeDeleteButton resumeId="r1" />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls DELETE endpoint and navigates on confirm", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(<ResumeDeleteButton resumeId="r1" />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/resumes/r1", {
        method: "DELETE",
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/resumes");
    });
    expect(mockRefresh).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("shows Deleting… text while request is in flight", async () => {
    let resolveDelete!: () => void;
    const deletePromise = new Promise<Response>((resolve) => {
      resolveDelete = () => resolve(new Response(null, { status: 204 }));
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockReturnValueOnce(deletePromise);

    render(<ResumeDeleteButton resumeId="r1" />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

    expect(
      screen.getByRole("button", { name: /deleting/i })
    ).toBeInTheDocument();

    // Resolve and wait for state updates to flush cleanly
    await act(async () => {
      resolveDelete();
      await deletePromise;
    });
    fetchSpy.mockRestore();
  });
});
