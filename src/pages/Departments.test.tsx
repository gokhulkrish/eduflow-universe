import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-001" });

const DEPT_KEY = "eduflow_departments";
const sample = [
  { id: "1", departmentName: "Computer Science", departmentCode: "CSE", hodName: "Dr. A", programLevel: "UG", sanctionedIntake: 120, naacNbaStatus: "Accredited" },
  { id: "2", departmentName: "Mathematics", departmentCode: "MTH", hodName: "Dr. B", programLevel: "PG", sanctionedIntake: 60, naacNbaStatus: "Applied" },
];

beforeEach(() => {
  window.localStorage.clear();
});

describe("Departments", () => {
  it("renders the page header and empty state", async () => {
    const { default: Departments } = await import("./Departments");
    render(<Departments />);
    expect(screen.getByText("Departments & Programs")).toBeInTheDocument();
    expect(screen.getByText("No departments added")).toBeInTheDocument();
  });

  it("shows summary stat cards with zero values when empty", async () => {
    const { default: Departments } = await import("./Departments");
    render(<Departments />);
    expect(screen.getAllByText("0")).toHaveLength(4);
  });

  it("renders table rows from localStorage data", async () => {
    window.localStorage.setItem(DEPT_KEY, JSON.stringify(sample));
    const { default: Departments } = await import("./Departments");
    render(<Departments />);
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("CSE")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("MTH")).toBeInTheDocument();
  });

  it("shows correct stat counts from data", async () => {
    window.localStorage.setItem(DEPT_KEY, JSON.stringify(sample));
    const { default: Departments } = await import("./Departments");
    render(<Departments />);
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("filters rows by search query", async () => {
    window.localStorage.setItem(DEPT_KEY, JSON.stringify(sample));
    const { default: Departments } = await import("./Departments");
    render(<Departments />);
    const searchInput = screen.getByPlaceholderText("Search departments...");
    fireEvent.change(searchInput, { target: { value: "Math" } });
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.queryByText("Computer Science")).not.toBeInTheDocument();
  });

  it("shows no-matches message when search yields nothing", async () => {
    window.localStorage.setItem(DEPT_KEY, JSON.stringify(sample));
    const { default: Departments } = await import("./Departments");
    render(<Departments />);
    const searchInput = screen.getByPlaceholderText("Search departments...");
    fireEvent.change(searchInput, { target: { value: "zzz" } });
    expect(screen.getByText("No matching departments")).toBeInTheDocument();
  });

  it("opens add dialog and adds a new department", async () => {
    window.localStorage.setItem(DEPT_KEY, JSON.stringify(sample));
    const { default: Departments } = await import("./Departments");
    render(<Departments />);

    fireEvent.click(screen.getByRole("button", { name: /add department/i }));

    expect(screen.getByText("Cancel")).toBeInTheDocument();

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Physics" } });
    fireEvent.change(inputs[1], { target: { value: "PHY" } });

    const addButton = screen.getByRole("button", { name: "Add" });
    fireEvent.click(addButton);

    const stored = JSON.parse(window.localStorage.getItem(DEPT_KEY) ?? "[]");
    expect(stored).toHaveLength(3);
    expect(stored[2].departmentName).toBe("Physics");
  });

  it("deletes a department and updates the table", async () => {
    window.localStorage.setItem(DEPT_KEY, JSON.stringify(sample));
    const { default: Departments } = await import("./Departments");
    render(<Departments />);

    const rows = screen.getAllByRole("row");
    const deleteBtn = rows[1].querySelector("button");
    fireEvent.click(deleteBtn!);

    const stored = JSON.parse(window.localStorage.getItem(DEPT_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].departmentName).toBe("Mathematics");
  });
});
