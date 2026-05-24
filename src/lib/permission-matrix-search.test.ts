import { describe, expect, it } from "vitest";
import { filterPermissionMatrixRows } from "./permission-matrix-search";
import type { CapabilityLevel, CapabilityPermissionRecord } from "./capability-matrix";

const permissions: CapabilityPermissionRecord[] = [
  { id: "p1", module_key: "students", action: "view", label: "View Students" },
  { id: "p2", module_key: "studentSearch", action: "view", label: "View Student Search" },
  { id: "p3", module_key: "videoRoomsSystem", action: "manage", label: "View Video Rooms" },
];

describe("permission matrix search", () => {
  it("matches module labels and actions globally", () => {
    const filtered = filterPermissionMatrixRows({
      permissions,
      query: "student search",
      roles: ["super_admin", "student"],
      roleLabels: { super_admin: "Super", student: "Stud." },
      matrix: new Map(),
      labelByModuleKey: (moduleKey) =>
        moduleKey === "studentSearch" ? "Student Search" : moduleKey === "videoRoomsSystem" ? "Video Rooms" : "Students",
    });

    expect(filtered.map((permission) => permission.id)).toEqual(["p2"]);
  });

  it("matches role and access level combinations", () => {
    const matrix = new Map<string, CapabilityLevel>([
      ["super_admin:p1", "manage"],
      ["student:p1", "view"],
      ["super_admin:p2", "none"],
      ["student:p2", "none"],
      ["super_admin:p3", "none"],
      ["student:p3", "view"],
    ]);

    const filtered = filterPermissionMatrixRows({
      permissions,
      query: "student view",
      roles: ["super_admin", "student"],
      roleLabels: { super_admin: "Super", student: "Stud." },
      matrix,
      labelByModuleKey: (moduleKey) =>
        moduleKey === "studentSearch" ? "Student Search" : moduleKey === "videoRoomsSystem" ? "Video Rooms" : "Students",
    });

    expect(filtered.map((permission) => permission.id)).toEqual(["p1", "p3"]);
  });

  it("treats role tokens as real access checks rather than module-name matches", () => {
    const matrix = new Map<string, CapabilityLevel>([
      ["super_admin:p1", "manage"],
      ["super_admin:p2", "none"],
      ["super_admin:p3", "none"],
    ]);

    const filtered = filterPermissionMatrixRows({
      permissions,
      query: "super",
      roles: ["super_admin", "student"],
      roleLabels: { super_admin: "Super", student: "Stud." },
      matrix,
      labelByModuleKey: (moduleKey) =>
        moduleKey === "studentSearch" ? "Student Search" : moduleKey === "videoRoomsSystem" ? "Video Rooms" : "Students",
    });

    expect(filtered.map((permission) => permission.id)).toEqual(["p1"]);
  });

  it("returns all rows when the query is empty", () => {
    const filtered = filterPermissionMatrixRows({
      permissions,
      query: "   ",
      roles: ["super_admin"],
      roleLabels: { super_admin: "Super" },
      matrix: new Map(),
    });

    expect(filtered).toHaveLength(3);
  });
});
