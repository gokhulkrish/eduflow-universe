import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-001" });

const RES_KEY = "eduflow_research";
const sample = [
  { id: "1", researchTitle: "Quantum Computing", principalInvestigator: "Dr. A", fundingAgency: "DST", grantAmount: 5000000, researchStage: "Ongoing" },
  { id: "2", researchTitle: "AI Ethics", principalInvestigator: "Dr. B", fundingAgency: "ICSSR", grantAmount: 2000000, researchStage: "Proposal" },
];

beforeEach(() => { window.localStorage.clear(); });

describe("ResearchInnovation", () => {
  it("renders header and empty state", async () => {
    const { default: Page } = await import("./ResearchInnovation");
    render(<Page />);
    expect(screen.getByText("Research & Innovation")).toBeInTheDocument();
    expect(screen.getByText("No projects added")).toBeInTheDocument();
  });

  it("renders rows from localStorage", async () => {
    window.localStorage.setItem(RES_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./ResearchInnovation");
    render(<Page />);
    expect(screen.getByText("Quantum Computing")).toBeInTheDocument();
    expect(screen.getByText("AI Ethics")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    window.localStorage.setItem(RES_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./ResearchInnovation");
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Search projects..."), { target: { value: "Quantum" } });
    expect(screen.getByText("Quantum Computing")).toBeInTheDocument();
    expect(screen.queryByText("AI Ethics")).not.toBeInTheDocument();
  });

  it("adds a new item", async () => {
    window.localStorage.setItem(RES_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./ResearchInnovation");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /add project/i }));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "ML Research" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const stored = JSON.parse(window.localStorage.getItem(RES_KEY) ?? "[]");
    expect(stored).toHaveLength(3);
  });

  it("deletes an item", async () => {
    window.localStorage.setItem(RES_KEY, JSON.stringify(sample));
    const { default: Page } = await import("./ResearchInnovation");
    render(<Page />);
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1].querySelector("button")!);
    const stored = JSON.parse(window.localStorage.getItem(RES_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
  });
});
