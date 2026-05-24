import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "./sidebar";

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

describe("SidebarProvider", () => {
  it("uses the default group selector so sidebar state styles can cascade", () => {
    const { container } = render(
      <SidebarProvider>
        <div>Sidebar child</div>
      </SidebarProvider>,
    );

    expect(screen.getByText("Sidebar child")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("group");
    expect(container.firstElementChild).not.toHaveClass("group/sidebar-wrapper");
  });
});
