import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildErpModuleDefinitions,
  buildErpWorkspaceUrl,
  mergeRecentModules,
  normalizeErpWorkspaceState,
  resolveErpWorkspaceKey,
  resolveNextErpWorkspaceState,
} from "./erp-workspace";
import {
  readServerState,
  isNextClientRuntime,
  resetErpWorkspaceRemoteSyncAvailability,
  saveServerState,
} from "../stores/erpWorkspace";

describe("erp workspace", () => {
  beforeEach(() => {
    resetErpWorkspaceRemoteSyncAvailability();
    vi.stubGlobal("fetch", vi.fn());
    document.querySelector("#__NEXT_DATA__")?.remove();
  });

  afterEach(() => {
    resetErpWorkspaceRemoteSyncAvailability();
    vi.unstubAllGlobals();
    document.querySelector("#__NEXT_DATA__")?.remove();
  });

  it("normalizes workspace state with parity-friendly defaults", () => {
    const state = normalizeErpWorkspaceState({
      activeModule: "courseInfo",
      activeWorkspaceKey: "mapping",
      sidebarExpanded: "false" as unknown as boolean,
      pinnedModules: ["fees", "fees", "attendance"],
      recentModules: ["fees", "", "attendance"],
    });

    expect(state.activeModule).toBe("courseInfo");
    expect(state.activeWorkspaceKey).toBe("mapping");
    expect(state.sidebarExpanded).toBe(false);
    expect(state.pinnedModules).toEqual(["fees", "attendance"]);
    expect(state.recentModules).toEqual(["fees", "attendance"]);
  });

  it("resolves the module workspace and recent order when switching", () => {
    const next = resolveNextErpWorkspaceState(
      normalizeErpWorkspaceState({
        activeModule: "fees",
        activeWorkspaceKey: "ledger",
        recentModules: ["fees", "attendance"],
      }),
      {
        moduleKey: "attendance",
        workspaceKey: "student",
        tabKey: "absences",
      },
    );

    expect(next.activeModule).toBe("attendance");
    expect(next.activeWorkspaceKey).toBe("student");
    expect(next.activeTab).toBe("absences");
    expect(next.recentModules[0]).toBe("attendance");
  });

  it("builds a launch url from the ERP route map", () => {
    expect(buildErpWorkspaceUrl("courseInfo", "mapping", "worklist")).toBe("/course-information?workspace=mapping&tab=worklist");
  });

  it("keeps the module workspace key within the registry", () => {
    expect(resolveErpWorkspaceKey("communication", "unknown")).toBe("notices");
  });

  it("merges recent modules without duplicates", () => {
    expect(mergeRecentModules(["attendance", "fees", "attendance"], "fees")).toEqual(["fees", "attendance"]);
  });

  it("builds the live ERP module catalog", () => {
    const catalog = buildErpModuleDefinitions();
    expect(catalog.find((module) => module.key === "fees")).toBeTruthy();
    expect(catalog.find((module) => module.key === "fees")?.workspaces[0]?.key).toBe("ledger");
  });

  it("skips ERP remote sync outside the Next runtime", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    const scope = { tenantId: "tenant-1", userId: "user-1" };
    const state = normalizeErpWorkspaceState({
      activeModule: "fees",
      activeWorkspaceKey: "ledger",
    });

    expect(isNextClientRuntime()).toBe(false);
    await expect(readServerState(scope)).resolves.toBeNull();
    await saveServerState(scope, state);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("detects a Next runtime from the injected bootstrap script", () => {
    const nextDataScript = document.createElement("script");
    nextDataScript.id = "__NEXT_DATA__";
    document.documentElement.appendChild(nextDataScript);

    expect(isNextClientRuntime()).toBe(true);
  });

  it("disables ERP remote sync after a 404 so later calls stay local", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const nextDataScript = document.createElement("script");
    nextDataScript.id = "__NEXT_DATA__";
    document.documentElement.appendChild(nextDataScript);

    const scope = { tenantId: "tenant-1", userId: "user-1" };
    const state = normalizeErpWorkspaceState({
      activeModule: "fees",
      activeWorkspaceKey: "ledger",
    });

    expect(isNextClientRuntime()).toBe(true);
    await saveServerState(scope, state);
    await saveServerState(scope, state);
    await readServerState(scope);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
