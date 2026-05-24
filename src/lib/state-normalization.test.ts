import { describe, expect, it } from "vitest";
import {
  normalizeContextState,
  normalizePanelVisibilityState,
  normalizeRegistryState,
  normalizeSettingsState,
  normalizeShellState,
  normalizeWorkspaceState,
} from "./state-normalization";

describe("state normalization", () => {
  it("normalizes shell state with safe defaults", () => {
    const state = normalizeShellState({ focus: "true" as any, theme: "dark", layoutMode: "mobile" });
    expect(state.focus).toBe(true);
    expect(state.theme).toBe("dark");
    expect(state.layoutMode).toBe("mobile");
    expect(state.sidebarCollapsed).toBe(true);
  });

  it("normalizes workspace, registry, panel, settings, and context shapes", () => {
    expect(normalizeWorkspaceState({ workspaceKey: 12 as any, searchQuery: false as any }).workspaceKey).toBe("12");
    expect(normalizeRegistryState({ filters: ["one", 2 as any, null as any] }).filters).toEqual(["one", "2"]);
    expect(normalizePanelVisibilityState({ openPanels: ["left", "right"], modalOpen: "yes" as any }).modalOpen).toBe(true);
    expect(normalizeSettingsState({ activeSectionKey: null as any }).activeSectionKey).toBe("general");
    expect(normalizeContextState({ contextKey: "", routeKey: "/settings" }).routeKey).toBe("/settings");
  });
});

