import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-001" });

const ACC_KEY = "eduflow_accreditation";
const sample = [
  { id: "1", qualityCycle: "2024-25", framework: "NAAC", criterion: "Curricular Aspects", evidenceStatus: "Verified", owner: "Dr. A" },
  { id: "2", qualityCycle: "2024-25", framework: "NBA", criterion: "Faculty", evidenceStatus: "Pending", owner: "Dr. B" },
];

beforeEach(() => { window.localStorage.clear(); });

describe("AccreditationIQAC", () => {
  it("renders header and empty state", async () => {
    const { default: Page } = await import("./AccreditationIQAC");
    render(<Page />);
    expect(screen.getByText("Accreditation & IQAC")).toBeInTheDocument();
    expect(screen.getByText("No accreditation records added")).toBeInTheDocument();
  });

  it("renders rows from localStorage", async () => {
    window.localStorage.setItem(ACC_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./AccreditationIQAC");
    render(<Page />);
    expect(screen.getByText("Curricular Aspects")).toBeInTheDocument();
    expect(screen.queryByText("Faculty")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    window.localStorage.setItem(ACC_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./AccreditationIQAC");
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Search accreditation records..."), { target: { value: "Curricular" } });
    expect(screen.getByText("Curricular Aspects")).toBeInTheDocument();
    expect(screen.queryByText("Faculty")).not.toBeInTheDocument();
  });

  it("adds a new item", async () => {
    window.localStorage.setItem(ACC_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./AccreditationIQAC");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /add record/i }));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Governance" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const stored = JSON.parse(window.localStorage.getItem(ACC_KEY) ?? "[]");
    expect(stored).toHaveLength(3);
  });

  it("deletes an item", async () => {
    window.localStorage.setItem(ACC_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./AccreditationIQAC");
    render(<Page />);
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1].querySelector("button")!);
    const stored = JSON.parse(window.localStorage.getItem(ACC_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
  });
});
