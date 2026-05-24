import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-001" });

const PROC_KEY = "eduflow_procurement";
const sample = [
  { id: "1", requestTitle: "Lab Equipment", vendorName: "TechCorp", assetTag: "AST-001", departmentName: "CSE", procurementStatus: "Approved" },
  { id: "2", requestTitle: "Furniture", vendorName: "WoodWorks", assetTag: "AST-002", departmentName: "Admin", procurementStatus: "Requested" },
];

beforeEach(() => { window.localStorage.clear(); });

describe("ProcurementAssets", () => {
  it("renders header and empty state", async () => {
    const { default: Page } = await import("./ProcurementAssets");
    render(<Page />);
    expect(screen.getByText("Procurement & Assets")).toBeInTheDocument();
    expect(screen.getByText("No procurement requests added")).toBeInTheDocument();
  });

  it("renders rows from localStorage", async () => {
    window.localStorage.setItem(PROC_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./ProcurementAssets");
    render(<Page />);
    expect(screen.getByText("Lab Equipment")).toBeInTheDocument();
    expect(screen.getByText("Furniture")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    window.localStorage.setItem(PROC_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./ProcurementAssets");
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Search requests..."), { target: { value: "Furniture" } });
    expect(screen.getByText("Furniture")).toBeInTheDocument();
    expect(screen.queryByText("Lab Equipment")).not.toBeInTheDocument();
  });

  it("adds a new item", async () => {
    window.localStorage.setItem(PROC_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./ProcurementAssets");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /add request/i }));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Projector" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const stored = JSON.parse(window.localStorage.getItem(PROC_KEY) ?? "[]");
    expect(stored).toHaveLength(3);
  });

  it("deletes an item", async () => {
    window.localStorage.setItem(PROC_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./ProcurementAssets");
    render(<Page />);
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1].querySelector("button")!);
    const stored = JSON.parse(window.localStorage.getItem(PROC_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
  });
});
