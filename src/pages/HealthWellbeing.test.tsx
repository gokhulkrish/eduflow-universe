import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-001" });

const HEALTH_KEY = "eduflow_health";
const sample = [
  { id: "1", caseTitle: "Annual Checkup", personName: "Rahul K.", caseType: "Medical", followUpDate: "2025-06-15", careStatus: "Open" },
  { id: "2", caseTitle: "Counselling Session", personName: "Priya S.", caseType: "Counselling", followUpDate: "2025-05-30", careStatus: "Monitoring" },
];

beforeEach(() => { window.localStorage.clear(); });

describe("HealthWellbeing", () => {
  it("renders header and empty state", async () => {
    const { default: Page } = await import("./HealthWellbeing");
    render(<Page />);
    expect(screen.getByText("Health & Wellbeing")).toBeInTheDocument();
    expect(screen.getByText("No health cases recorded")).toBeInTheDocument();
  });

  it("renders rows from localStorage", async () => {
    window.localStorage.setItem(HEALTH_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./HealthWellbeing");
    render(<Page />);
    expect(screen.getByText("Annual Checkup")).toBeInTheDocument();
    expect(screen.getByText("Counselling Session")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    window.localStorage.setItem(HEALTH_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./HealthWellbeing");
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), { target: { value: "Checkup" } });
    expect(screen.getByText("Annual Checkup")).toBeInTheDocument();
    expect(screen.queryByText("Counselling Session")).not.toBeInTheDocument();
  });

  it("adds a new item", async () => {
    window.localStorage.setItem(HEALTH_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./HealthWellbeing");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /add case/i }));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Eye Checkup Camp" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const stored = JSON.parse(window.localStorage.getItem(HEALTH_KEY) ?? "[]");
    expect(stored).toHaveLength(3);
  });

  it("deletes an item", async () => {
    window.localStorage.setItem(HEALTH_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./HealthWellbeing");
    render(<Page />);
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1].querySelector("button")!);
    const stored = JSON.parse(window.localStorage.getItem(HEALTH_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
  });
});
