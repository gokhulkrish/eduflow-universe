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
    const state = normalizeShellState({ focus: "true", theme: "dark", layoutMode: "mobile" });
    expect(state.focus).toBe(true);
    expect(state.theme).toBe("dark");
    expect(state.layoutMode).toBe("mobile");
    expect(state.sidebarCollapsed).toBe(true);
  });

  it("normalizes workspace, registry, panel, settings, and context shapes", () => {
    expect(normalizeWorkspaceState({ workspaceKey: 12, searchQuery: false }).workspaceKey).toBe("12");
    expect(normalizeRegistryState({ filters: ["one", 2, null] }).filters).toEqual(["one", "2"]);
    expect(normalizePanelVisibilityState({ openPanels: ["left", "right"], modalOpen: "yes" }).modalOpen).toBe(true);
    expect(normalizeSettingsState({ activeSectionKey: null }).activeSectionKey).toBe("general");
    expect(normalizeContextState({ contextKey: "", routeKey: "/settings" }).routeKey).toBe("/settings");
  });
});

