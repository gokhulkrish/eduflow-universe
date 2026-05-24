import { describe, expect, it } from "vitest";
import {
  defaultGlobalRolePermissionLevel,
  getCanonicalRegistryLabel,
  getMissingRegistryModuleKeys,
} from "./global-rbac-seeder";

describe("global RBAC seeder helpers", () => {
  it("returns canonical module labels", () => {
    expect(getCanonicalRegistryLabel("promotion")).toBe("Auto Promotion Engine");
    expect(getCanonicalRegistryLabel("id-cards")).toBe("Digital ID Cards");
    expect(getCanonicalRegistryLabel("studentInformation")).toBe("Student Information");
  });

  it("detects missing registry keys from the current permission set", () => {
    const missing = getMissingRegistryModuleKeys(["students", "attendance", "reports"]);

    expect(missing).toContain("promotion");
    expect(missing).toContain("live");
    expect(missing).not.toContain("students");
  });

  it("maps default role permission levels for seeded registry keys", () => {
    expect(defaultGlobalRolePermissionLevel("super_admin", "promotion")).toBe("manage");
    expect(defaultGlobalRolePermissionLevel("hod", "studentSearch")).toBe("manage");
    expect(defaultGlobalRolePermissionLevel("student", "videoRoomsSystem")).toBe("view");
    expect(defaultGlobalRolePermissionLevel("student", "studentImport")).toBe("none");
  });
});
