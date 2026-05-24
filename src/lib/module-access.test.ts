import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, eqMock, selectMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  eqMock: vi.fn(),
  selectMock: vi.fn(),
}));

const { getUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  },
}));

vi.mock("@/lib/supabase-health", () => ({
  tableExists: vi.fn(async () => true),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  window.localStorage.clear();

  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  eqMock.mockResolvedValue({ data: [], error: null });
  selectMock.mockReturnValue({ eq: eqMock, in: eqMock, order: vi.fn().mockReturnValue({ range: vi.fn().mockResolvedValue({ data: [], error: null }) }) });
  fromMock.mockReturnValue({ select: selectMock });
});

describe("module access", () => {
  it("uses runtime capability overrides before hitting the database", async () => {
    const runtime = await import("./capability-runtime");
    runtime.setCapabilityRuntimeOverride({
      moduleKey: "reports",
      level: "manage",
      label: "Reports",
      reason: "runtime test",
    });

    const { isModuleEnabled } = await import("./module-access");
    await expect(isModuleEnabled("reports")).resolves.toBe(true);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("respects disabled runtime overrides", async () => {
    const runtime = await import("./capability-runtime");
    runtime.setCapabilityRuntimeOverride({
      moduleKey: "exams",
      level: "none",
      label: "Exams",
      reason: "runtime test",
    });

    const { isModuleEnabled } = await import("./module-access");
    await expect(isModuleEnabled("exams")).resolves.toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("checks role permissions for the current user", async () => {
    const permissionsSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [{ id: "perm-1" }], error: null }),
    });
    const userRolesSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [{ role: "admin" }], error: null }),
    });
    const rolePermissionsRangeMock = vi.fn().mockResolvedValue({
      data: [{ role: "admin", permission_id: "perm-1", level: "manage" }],
      error: null,
    });
    const rolePermissionsOrderMock = vi.fn().mockReturnValue({ range: rolePermissionsRangeMock });
    const rolePermissionsSelectMock = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({ order: rolePermissionsOrderMock }),
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "permissions") return { select: permissionsSelectMock };
      if (table === "user_roles") return { select: userRolesSelectMock };
      if (table === "role_permissions") return { select: rolePermissionsSelectMock };
      return { select: selectMock };
    });

    const { isModuleEnabled } = await import("./module-access");
    await expect(isModuleEnabled("students")).resolves.toBe(true);
    expect(getUserMock).toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledWith("permissions");
    expect(fromMock).toHaveBeenCalledWith("user_roles");
    expect(fromMock).toHaveBeenCalledWith("role_permissions");
  });

  it("denies access when the user has no matching role permission", async () => {
    const permissionsSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [{ id: "perm-1" }], error: null }),
    });
    const userRolesSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [{ role: "faculty" }], error: null }),
    });
    const rolePermissionsRangeMock = vi.fn().mockResolvedValue({
      data: [{ role: "faculty", permission_id: "perm-1", level: "none" }],
      error: null,
    });
    const rolePermissionsOrderMock = vi.fn().mockReturnValue({ range: rolePermissionsRangeMock });
    const rolePermissionsSelectMock = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({ order: rolePermissionsOrderMock }),
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "permissions") return { select: permissionsSelectMock };
      if (table === "user_roles") return { select: userRolesSelectMock };
      if (table === "role_permissions") return { select: rolePermissionsSelectMock };
      return { select: selectMock };
    });

    const { isModuleEnabled } = await import("./module-access");
    await expect(isModuleEnabled("students")).resolves.toBe(false);
  });
});
