import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-001" });

const LMS_KEY = "eduflow_lms";
const sample = [
  { id: "1", courseRoom: "CS101-A", contentUnit: "Data Structures", facultyOwner: "Dr. X", engagementPercent: 75, completionStatus: "In Progress" },
  { id: "2", courseRoom: "MTH201-B", contentUnit: "Linear Algebra", facultyOwner: "Dr. Y", engagementPercent: 90, completionStatus: "Completed" },
];

beforeEach(() => { window.localStorage.clear(); });

describe("LmsElearning", () => {
  it("renders header and empty state", async () => {
    const { default: Page } = await import("./LmsElearning");
    render(<Page />);
    expect(screen.getByText("LMS & E-Learning")).toBeInTheDocument();
    expect(screen.getByText("No course rooms added")).toBeInTheDocument();
  });

  it("renders rows from localStorage", async () => {
    window.localStorage.setItem(LMS_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./LmsElearning");
    render(<Page />);
    expect(screen.getByText("CS101-A")).toBeInTheDocument();
    expect(screen.getByText("MTH201-B")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    window.localStorage.setItem(LMS_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./LmsElearning");
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Search course rooms..."), { target: { value: "MTH" } });
    expect(screen.getByText("MTH201-B")).toBeInTheDocument();
    expect(screen.queryByText("CS101-A")).not.toBeInTheDocument();
  });

  it("adds a new item", async () => {
    window.localStorage.setItem(LMS_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./LmsElearning");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /add course room/i }));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "PHY301-C" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const stored = JSON.parse(window.localStorage.getItem(LMS_KEY) ?? "[]");
    expect(stored).toHaveLength(3);
  });

  it("deletes an item", async () => {
    window.localStorage.setItem(LMS_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./LmsElearning");
    render(<Page />);
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1].querySelector("button")!);
    const stored = JSON.parse(window.localStorage.getItem(LMS_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
  });
});
