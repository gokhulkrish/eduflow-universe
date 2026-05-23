import { afterEach, describe, expect, it } from "vitest";
import {
  bootstrapShellRuntime,
  clearShellRuntimeStorage,
  getShellRuntimeSnapshot,
  setShellRuntimeSnapshot,
  SHELL_RUNTIME_STORAGE_KEY,
} from "./shell-runtime";

describe("shell runtime", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.body.className = "";
    clearShellRuntimeStorage();
  });

  it("boots with preboot classes and returns a normalized snapshot", () => {
    const snapshot = bootstrapShellRuntime();
    expect(snapshot.theme === "light" || snapshot.theme === "dark").toBe(true);
    expect(document.documentElement.classList.contains("shell-booting")).toBe(true);
    expect(document.documentElement.dataset.sidebarMode).toBe(snapshot.shellMode);
  });

  it("persists runtime changes", () => {
    setShellRuntimeSnapshot({ focus: true, fabOpen: true, theme: "dark", layoutMode: "desktop" });
    const snapshot = getShellRuntimeSnapshot();
    expect(snapshot.focus).toBe(true);
    expect(snapshot.fabOpen).toBe(true);
    expect(snapshot.theme).toBe("dark");
    expect(snapshot.layoutMode).toBe("desktop");
    expect(window.localStorage.getItem(SHELL_RUNTIME_STORAGE_KEY)).toContain('"focus":true');
  });
});

