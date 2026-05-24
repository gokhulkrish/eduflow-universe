import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  bootstrapLegacyAdapterLayer,
  bridgeLegacyRegistryPayload,
  buildLegacyAdapterReport,
  emitLegacyAdapterEvent,
  resetLegacyAdapterRuntime,
  subscribeLegacyAdapterEvents,
  translateLegacyRoute,
  translateLegacyStorageKey,
  translateLegacyPanelSnapshot,
  translateLegacyRegistrySnapshot,
  translateLegacySettingsSnapshot,
  translateLegacyWorkspaceSnapshot,
} from "./legacy-adapter";
import { THEME_STORAGE_KEY } from "./theme-runtime";

describe("legacy adapter layer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetLegacyAdapterRuntime();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetLegacyAdapterRuntime();
  });

  it("translates legacy routes to the current shell routes", () => {
    expect(translateLegacyRoute("/registeredStudents")).toBe("/students");
    expect(translateLegacyRoute("settings-backup")).toBe("/settings");
  });

  it("translates known legacy storage aliases", () => {
    expect(translateLegacyStorageKey("eduflow.theme.mode")).toBe(THEME_STORAGE_KEY);
  });

  it("seeds modern storage keys from legacy aliases", () => {
    window.localStorage.setItem("eduflow.theme.mode", JSON.stringify("dark"));

    bootstrapLegacyAdapterLayer();

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(JSON.stringify("dark"));
    expect(buildLegacyAdapterReport().seededStorageAliases).toBeGreaterThanOrEqual(1);
  });

  it("bridges legacy state payloads and panel snapshots", () => {
    const workspace = translateLegacyWorkspaceSnapshot({ workspaceKey: "students", searchQuery: "A" });
    const registry = translateLegacyRegistrySnapshot({ activeRegistryKey: "headers", filters: ["one"] });
    const settings = translateLegacySettingsSnapshot({ activeSectionKey: "general", sidebarCollapsed: true });
    const panel = translateLegacyPanelSnapshot({ activePanelKey: "details", openPanels: ["details"] });
    const bridged = bridgeLegacyRegistryPayload({
      workspace: { workspaceKey: "students" },
      registry: { activeRegistryKey: "headers" },
      settings: { activeSectionKey: "general" },
      panel: { activePanelKey: "details" },
    });

    expect(workspace.workspaceKey).toBe("students");
    expect(registry.activeRegistryKey).toBe("headers");
    expect(settings.activeSectionKey).toBe("general");
    expect(panel.activePanelKey).toBe("details");
    expect(bridged.workspace.workspaceKey).toBe("students");
    expect(buildLegacyAdapterReport().apiBridges).toBeGreaterThan(0);
  });

  it("emits and subscribes to legacy adapter events", () => {
    let calls = 0;
    const unsubscribe = subscribeLegacyAdapterEvents(() => {
      calls += 1;
    });

    emitLegacyAdapterEvent("legacy:registry-change", { source: "test" });
    unsubscribe();

    expect(calls).toBeGreaterThanOrEqual(1);
    expect(buildLegacyAdapterReport().mirroredLegacyEvents).toBeGreaterThanOrEqual(1);
  });
});
