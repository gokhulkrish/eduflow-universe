import { describe, expect, it } from "vitest";
import { buildCapabilityMatrix, isCapabilityAtLeast } from "./capability-matrix";

describe("capability matrix engine", () => {
  it("groups permissions by module and summarizes role coverage", () => {
    const matrix = new Map<string, "none" | "view" | "manage">([
      ["admin:perm-1", "manage"],
      ["faculty:perm-1", "view"],
      ["faculty:perm-2", "view"],
    ]);

    const model = buildCapabilityMatrix({
      roles: ["admin", "faculty"],
      permissions: [
        { id: "perm-1", module_key: "students", action: "view", label: "View Students" },
        { id: "perm-2", module_key: "students", action: "edit", label: "Edit Students" },
        { id: "perm-3", module_key: "fees", action: "export", label: "Export Fees" },
      ],
      matrix,
      dirtyKeys: new Set(["admin:perm-1", "faculty:perm-2"]),
    });

    expect(model.summary.moduleCount).toBe(2);
    expect(model.summary.permissionCount).toBe(3);
    expect(model.summary.assignedCount).toBe(3);
    expect(model.summary.dirtyCount).toBe(2);
    expect(model.groups[0].moduleKey).toBe("fees");
    expect(model.groups[1].moduleKey).toBe("students");
    expect(model.groups[1].highestLevel).toBe("manage");
    expect(model.groups[1].roleCoverage.admin.grantedCount).toBe(1);
    expect(model.groups[1].roleCoverage.faculty.grantedCount).toBe(2);
    expect(model.roleSummaries.find((role) => role.role === "admin")?.highestLevel).toBe("manage");
    expect(model.roleSummaries.find((role) => role.role === "faculty")?.grantedCount).toBe(2);
  });

  it("prefers canonical labels when provided", () => {
    const model = buildCapabilityMatrix({
      roles: ["admin"],
      permissions: [
        { id: "perm-1", module_key: "promotion", action: "view", label: "View Promotion" },
      ],
      matrix: new Map(),
      labelByModuleKey: (moduleKey) => {
        if (moduleKey === "promotion") return "Auto Promotion Engine";
        return moduleKey;
      },
    });

    expect(model.groups[0].label).toBe("Auto Promotion Engine");
  });

  it("evaluates capability levels by precedence", () => {
    expect(isCapabilityAtLeast("manage", "view")).toBe(true);
    expect(isCapabilityAtLeast("view", "edit")).toBe(false);
  });
});
