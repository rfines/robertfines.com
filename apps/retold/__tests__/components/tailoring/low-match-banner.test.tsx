import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LowMatchBanner } from "@/components/tailoring/low-match-banner";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

describe("LowMatchBanner", () => {
  const defaultProps = {
    score: 32,
    resumeId: "resume-1",
    tailoredId: "tailored-1",
  };

  it("renders an alert with the score", () => {
    render(<LowMatchBanner {...defaultProps} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Low keyword coverage (32%)")
    ).toBeInTheDocument();
  });

  it("shows ATS warning text", () => {
    render(<LowMatchBanner {...defaultProps} />);
    expect(
      screen.getByText(/may not pass ATS filters/)
    ).toBeInTheDocument();
  });

  it("renders See what's missing button", () => {
    render(<LowMatchBanner {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /see what's missing/i })
    ).toBeInTheDocument();
  });

  it("scrolls to gap-analysis section on See what's missing click", async () => {
    const scrollMock = vi.fn();
    const el = document.createElement("div");
    el.id = "gap-analysis";
    el.scrollIntoView = scrollMock;
    document.body.appendChild(el);

    render(<LowMatchBanner {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /see what's missing/i })
    );
    expect(scrollMock).toHaveBeenCalledWith({ behavior: "smooth" });

    document.body.removeChild(el);
  });

  it("renders re-tailor link with aggressive intensity", () => {
    render(<LowMatchBanner {...defaultProps} />);
    const link = screen.getByRole("link", {
      name: /re-tailor aggressively/i,
    });
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/resumes/resume-1/tailor?from=tailored-1&intensity=aggressive"
    );
  });

  it("displays different scores correctly", () => {
    render(<LowMatchBanner {...defaultProps} score={12} />);
    expect(
      screen.getByText("Low keyword coverage (12%)")
    ).toBeInTheDocument();
  });
});
