import { beforeEach, describe, expect, it } from "vitest";
import {
  buildGroupRuntimeModel,
  clearGroupRuntimeStorage,
  getGroupRuntimeOverview,
  getGroupRuntimeNamespaceState,
  resetGroupRuntimeNamespace,
  setGroupSectionVisibility,
  toggleGroupSectionVisibility,
  GROUP_MODEL_STORAGE_KEY,
} from "./group-model";

beforeEach(() => {
  localStorage.removeItem(GROUP_MODEL_STORAGE_KEY);
});

describe("group model engine", () => {
  it("normalizes duplicate groups and duplicate actions", () => {
    const model = buildGroupRuntimeModel("students.ribbon", [
      {
        id: "clipboard",
        title: "Clipboard",
        actions: [
          { id: "copy", label: "Copy" },
          { id: "paste", label: "Paste" },
        ],
      },
      {
        id: "clipboard",
        title: "Clipboard Duplicate",
        actions: [
          { id: "copy", label: "Copy Again" },
          { id: "json", label: "JSON" },
        ],
      },
      {
        id: "records",
        title: "Records",
        actions: [{ id: "copy", label: "Copy" }],
      },
    ]);

    expect(model.summary.groupCount).toBe(2);
    expect(model.summary.collisionCount).toBeGreaterThan(0);
    expect(model.sections.find((section) => section.id === "clipboard")?.actionCount).toBe(3);
    expect(model.sections.find((section) => section.id === "records")?.actionCount).toBe(0);
    expect(model.summary.duplicateActionCount).toBeGreaterThan(0);
  });

  it("persists visibility state per namespace", () => {
    toggleGroupSectionVisibility("students.ribbon", "records");
    expect(getGroupRuntimeNamespaceState("students.ribbon").hiddenGroupIds).toContain("records");

    setGroupSectionVisibility("students.ribbon", "records", true);
    expect(getGroupRuntimeNamespaceState("students.ribbon").hiddenGroupIds).not.toContain("records");

    resetGroupRuntimeNamespace("students.ribbon");
    expect(getGroupRuntimeNamespaceState("students.ribbon").hiddenGroupIds).toHaveLength(0);
  });

  it("summarizes namespaces and supports clearing runtime storage", () => {
    setGroupSectionVisibility("students.ribbon", "records", false);
    setGroupSectionVisibility("students.ribbon", "advanced", false);
    setGroupSectionVisibility("teachers.ribbon", "home", false);

    const overview = getGroupRuntimeOverview();
    expect(overview.namespaceCount).toBe(2);
    expect(overview.hiddenGroupCount).toBe(3);
    expect(overview.namespaces.map((entry) => entry.namespace)).toEqual(["students.ribbon", "teachers.ribbon"]);
    expect(overview.namespaces[0].hiddenGroupCount).toBe(2);

    clearGroupRuntimeStorage();
    expect(getGroupRuntimeOverview().namespaceCount).toBe(0);
    expect(window.localStorage.getItem(GROUP_MODEL_STORAGE_KEY)).toBeNull();
  });
});
