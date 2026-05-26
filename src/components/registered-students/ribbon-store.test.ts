import { describe, it, expect, beforeEach } from "vitest";
import { useRegisteredRibbon, registeredRibbonUiState } from "@/stores/registeredRibbonStore";

describe("useRegisteredRibbon", () => {
  beforeEach(() => {
    useRegisteredRibbon.setState({
      activeTab: "home",
      viewMode: "grid",
      compact: false,
      wrap: false,
      freezeFirst: false,
      freezeActions: false,
      banded: false,
      focus: false,
      highlightMissing: false,
      gridLines: true,
      rowStripes: true,
      sortField: "name",
      sortDirection: "asc",
      clipboard: { studentId: null, snapshot: null },
      selectedFilterKeys: ["name", "class", "status", "gender"],
    });
  });

  it("has home as default active tab", () => {
    expect(useRegisteredRibbon.getState().activeTab).toBe("home");
  });

  it("setActiveTab switches tab", () => {
    useRegisteredRibbon.getState().setActiveTab("data");
    expect(useRegisteredRibbon.getState().activeTab).toBe("data");
  });

  it("toggles compact flag", () => {
    expect(useRegisteredRibbon.getState().compact).toBe(false);
    useRegisteredRibbon.getState().toggleCompact();
    expect(useRegisteredRibbon.getState().compact).toBe(true);
    useRegisteredRibbon.getState().toggleCompact();
    expect(useRegisteredRibbon.getState().compact).toBe(false);
  });

  it("toggles wrap flag", () => {
    useRegisteredRibbon.getState().toggleWrap();
    expect(useRegisteredRibbon.getState().wrap).toBe(true);
  });

  it("toggles freezeFirst flag", () => {
    useRegisteredRibbon.getState().toggleFreezeFirst();
    expect(useRegisteredRibbon.getState().freezeFirst).toBe(true);
  });

  it("toggles freezeActions flag", () => {
    useRegisteredRibbon.getState().toggleFreezeActions();
    expect(useRegisteredRibbon.getState().freezeActions).toBe(true);
  });

  it("toggles banded flag", () => {
    useRegisteredRibbon.getState().toggleBanded();
    expect(useRegisteredRibbon.getState().banded).toBe(true);
  });

  it("toggles focus flag", () => {
    useRegisteredRibbon.getState().toggleFocus();
    expect(useRegisteredRibbon.getState().focus).toBe(true);
  });

  it("toggles highlightMissing flag", () => {
    useRegisteredRibbon.getState().toggleHighlightMissing();
    expect(useRegisteredRibbon.getState().highlightMissing).toBe(true);
  });

  it("toggles gridLines flag", () => {
    useRegisteredRibbon.getState().toggleGridLines();
    expect(useRegisteredRibbon.getState().gridLines).toBe(false);
  });

  it("toggles rowStripes flag", () => {
    useRegisteredRibbon.getState().toggleRowStripes();
    expect(useRegisteredRibbon.getState().rowStripes).toBe(false);
  });

  it("toggles detailExpanded flag", () => {
    useRegisteredRibbon.getState().toggleDetailExpanded();
    expect(useRegisteredRibbon.getState().detailExpanded).toBe(true);
  });

  it("sets sort field and direction", () => {
    useRegisteredRibbon.getState().setSortField("class");
    expect(useRegisteredRibbon.getState().sortField).toBe("class");
    useRegisteredRibbon.getState().setSortDirection("desc");
    expect(useRegisteredRibbon.getState().sortDirection).toBe("desc");
  });

  it("manages clipboard state", () => {
    const clip = { studentId: "s1", snapshot: { name: "Test" } };
    useRegisteredRibbon.getState().setClipboard(clip);
    expect(useRegisteredRibbon.getState().clipboard).toEqual(clip);
    useRegisteredRibbon.getState().clearClipboard();
    expect(useRegisteredRibbon.getState().clipboard).toEqual({ studentId: null, snapshot: null });
  });

  it("sets selected filter keys", () => {
    useRegisteredRibbon.getState().setSelectedFilterKeys(["name", "status"]);
    expect(useRegisteredRibbon.getState().selectedFilterKeys).toEqual(["name", "status"]);
  });

  it("sets filter config", () => {
    const cfg = { name: { key: "name", label: "Name", type: "text" as const, mapTo: "display_name" } };
    useRegisteredRibbon.getState().setFilterConfig(cfg);
    expect(useRegisteredRibbon.getState().filterConfig).toEqual(cfg);
  });

  it("registeredRibbonUiState mirrors store", () => {
    useRegisteredRibbon.getState().setActiveTab("admin");
    expect(registeredRibbonUiState.activeTab).toBe("admin");
    useRegisteredRibbon.getState().toggleCompact();
    expect(registeredRibbonUiState.compact).toBe(true);
  });
});
