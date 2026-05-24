import { beforeEach, describe, expect, it } from "vitest";
import { buildCapabilityMatrix } from "./capability-matrix";

beforeEach(() => {
  window.localStorage.clear();
});

describe("capability runtime", () => {
  it("stores, resolves, and clears runtime overrides", async () => {
    const runtime = await import("./capability-runtime");

    const snapshot = runtime.setCapabilityRuntimeOverride({
      moduleKey: "reports",
      level: "manage",
      label: "Reports",
      reason: "runtime test",
    });

    expect(snapshot.overrides).toHaveLength(1);
    expect(runtime.resolveCapabilityRuntimeLevel("reports")).toBe("manage");
    expect(runtime.isCapabilityRuntimeEnabled("reports")).toBe(true);

    runtime.setCapabilityRuntimeOverride({
      moduleKey: "reports",
      level: "none",
      label: "Reports",
      reason: "disable",
    });

    expect(runtime.isCapabilityRuntimeEnabled("reports")).toBe(false);
    expect(runtime.getCapabilityRuntimeOverride("reports")?.level).toBe("none");

    runtime.clearCapabilityRuntimeOverride("reports");
    expect(runtime.getCapabilityRuntimeOverride("reports")).toBeNull();
  });

  it("builds system badges from the capability matrix", async () => {
    const model = buildCapabilityMatrix({
      roles: ["admin", "faculty"],
      permissions: [
        { id: "perm-1", module_key: "students", action: "view", label: "View Students" },
        { id: "perm-2", module_key: "fees", action: "edit", label: "Edit Fees" },
      ],
      matrix: new Map([
        ["admin:perm-1", "manage"],
        ["faculty:perm-2", "view"],
      ]),
    });

    const runtime = await import("./capability-runtime");
    const badges = runtime.buildCapabilitySystemBadges(model);

    expect(badges.some((badge) => badge.kind === "module" && badge.label === "Students")).toBe(true);
    expect(badges.some((badge) => badge.kind === "role" && badge.label === "admin")).toBe(true);
  });
});
