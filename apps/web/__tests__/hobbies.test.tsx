import { describe, it, expect, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import HobbiesPage from "@/app/hobbies/page";
import Nav from "@/components/nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/hobbies",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: ComponentProps<"a"> & { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("HobbiesPage", () => {
  it("renders all nine hobby cards", () => {
    render(<HobbiesPage />);
    expect(screen.getByText(/music \/ albums/i)).toBeInTheDocument();
    expect(screen.getByText(/^books$/i)).toBeInTheDocument();
    expect(screen.getByText(/movies \/ tv/i)).toBeInTheDocument();
    expect(screen.getByText(/^gaming$/i)).toBeInTheDocument();
    expect(screen.getByText(/^hiking$/i)).toBeInTheDocument();
    expect(screen.getByText(/^travel$/i)).toBeInTheDocument();
    expect(screen.getByText(/^woodworking$/i)).toBeInTheDocument();
    expect(screen.getByText(/^gardening$/i)).toBeInTheDocument();
    expect(screen.getByText(/^DIY$/)).toBeInTheDocument();
  });

  it("only links the Music card", () => {
    render(<HobbiesPage />);
    const musicLink = screen.getByRole("link", { name: /music \/ albums/i });
    expect(musicLink).toHaveAttribute("href", "/hobbies/albums");
    expect(screen.queryByRole("link", { name: /^books$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /^gaming$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /^hiking$/i })).toBeNull();
  });
});

describe("Nav", () => {
  it("contains a ~/hobbies link pointing to /hobbies", () => {
    render(<Nav />);
    const link = screen.getByRole("link", { name: /~\/hobbies/ });
    expect(link).toHaveAttribute("href", "/hobbies");
  });
});
