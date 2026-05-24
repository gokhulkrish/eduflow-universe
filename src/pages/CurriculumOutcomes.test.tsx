import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-001" });

const CURR_KEY = "eduflow_curriculum";
const sample = [
  { id: "1", curriculumName: "B.Tech CSE", courseCode: "CS101", semester: "3", outcomeMapStatus: "Mapped", syllabusCoverage: 85, attainmentBand: "High" },
  { id: "2", curriculumName: "M.Tech AI", courseCode: "AI501", semester: "1", outcomeMapStatus: "Draft", syllabusCoverage: 40, attainmentBand: "Low" },
];

beforeEach(() => { window.localStorage.clear(); });

describe("CurriculumOutcomes", () => {
  it("renders header and empty state", async () => {
    const { default: Page } = await import("./CurriculumOutcomes");
    render(<Page />);
    expect(screen.getByText("Curriculum & Outcomes")).toBeInTheDocument();
    expect(screen.getByText("No curricula added")).toBeInTheDocument();
  });

  it("renders rows from localStorage", async () => {
    window.localStorage.setItem(CURR_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./CurriculumOutcomes");
    render(<Page />);
    expect(screen.getByText("B.Tech CSE")).toBeInTheDocument();
    expect(screen.getByText("M.Tech AI")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    window.localStorage.setItem(CURR_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./CurriculumOutcomes");
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Search curricula..."), { target: { value: "AI" } });
    expect(screen.getByText("M.Tech AI")).toBeInTheDocument();
    expect(screen.queryByText("B.Tech CSE")).not.toBeInTheDocument();
  });

  it("adds a new item", async () => {
    window.localStorage.setItem(CURR_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./CurriculumOutcomes");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /add curriculum/i }));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "B.Sc Physics" } });
    fireEvent.change(inputs[1], { target: { value: "PH201" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const stored = JSON.parse(window.localStorage.getItem(CURR_KEY) ?? "[]");
    expect(stored).toHaveLength(3);
  });

  it("deletes an item", async () => {
    window.localStorage.setItem(CURR_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./CurriculumOutcomes");
    render(<Page />);
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1].querySelector("button")!);
    const stored = JSON.parse(window.localStorage.getItem(CURR_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
  });
});
