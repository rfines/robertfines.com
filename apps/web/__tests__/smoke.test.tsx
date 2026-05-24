import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/footer";

describe("Footer", () => {
  it("renders the current year and name", () => {
    render(<Footer />);
    expect(screen.getByText(/© \d{4} Robert Fines/)).toBeInTheDocument();
  });
});
