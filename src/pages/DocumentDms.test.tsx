import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-001" });

const DMS_KEY = "eduflow_dms";
const sample = [
  { id: "1", documentTitle: "Student Handbook", documentType: "Policy", owner: "Registrar", expiryDate: "2026-01-01", documentStatus: "Approved" },
  { id: "2", documentTitle: "Lab Report Template", documentType: "Template", owner: "HOD CS", expiryDate: "2025-12-31", documentStatus: "Draft" },
];

beforeEach(() => { window.localStorage.clear(); });

describe("DocumentDms", () => {
  it("renders header and empty state", async () => {
    const { default: Page } = await import("./DocumentDms");
    render(<Page />);
    expect(screen.getByText("Documents & DMS")).toBeInTheDocument();
    expect(screen.getByText("No documents added")).toBeInTheDocument();
  });

  it("renders rows from localStorage", async () => {
    window.localStorage.setItem(DMS_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./DocumentDms");
    render(<Page />);
    expect(screen.getByText("Student Handbook")).toBeInTheDocument();
    expect(screen.getByText("Lab Report Template")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    window.localStorage.setItem(DMS_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./DocumentDms");
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Search documents..."), { target: { value: "Handbook" } });
    expect(screen.getByText("Student Handbook")).toBeInTheDocument();
    expect(screen.queryByText("Lab Report Template")).not.toBeInTheDocument();
  });

  it("adds a new item", async () => {
    window.localStorage.setItem(DMS_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./DocumentDms");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /add document/i }));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Accreditation Report" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const stored = JSON.parse(window.localStorage.getItem(DMS_KEY) ?? "[]");
    expect(stored).toHaveLength(3);
  });

  it("deletes an item", async () => {
    window.localStorage.setItem(DMS_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./DocumentDms");
    render(<Page />);
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1].querySelector("button")!);
    const stored = JSON.parse(window.localStorage.getItem(DMS_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
  });
});
