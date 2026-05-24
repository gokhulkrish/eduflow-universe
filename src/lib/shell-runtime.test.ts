import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bootstrapShellRuntime,
  clearShellRuntimeStorage,
  getShellRuntimeSnapshot,
  subscribeShellRuntime,
  setShellRuntimeSnapshot,
  SHELL_RUNTIME_STORAGE_KEY,
} from "./shell-runtime";

describe("shell runtime", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.body.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-sidebar-mode");
    document.documentElement.removeAttribute("data-focus-mode");
    document.documentElement.removeAttribute("data-focus-compression");
    document.body.removeAttribute("data-shell-mode");
    document.body.removeAttribute("data-focus-mode");
    document.body.removeAttribute("data-focus-compression");
    clearShellRuntimeStorage();
  });

  it("boots with preboot classes and returns a normalized snapshot", () => {
    const snapshot = bootstrapShellRuntime();
    expect(snapshot.theme === "light" || snapshot.theme === "dark").toBe(true);
    expect(document.documentElement.classList.contains("shell-booting")).toBe(true);
    expect(document.documentElement.dataset.sidebarMode).toBe(snapshot.shellMode);
  });

  it("persists runtime changes", () => {
    setShellRuntimeSnapshot({ focusMode: "deep", fabOpen: true, theme: "dark", layoutMode: "desktop" });
    const snapshot = getShellRuntimeSnapshot();
    expect(snapshot.focus).toBe(true);
    expect(snapshot.focusMode).toBe("deep");
    expect(snapshot.fabOpen).toBe(true);
    expect(snapshot.theme).toBe("dark");
    expect(snapshot.layoutMode).toBe("desktop");
    expect(window.localStorage.getItem(SHELL_RUNTIME_STORAGE_KEY)).toContain('"focusMode":"deep"');
  });

  it("reuses the shared resize listener across subscribers", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const unsubscribeA = subscribeShellRuntime(() => {});
    const unsubscribeB = subscribeShellRuntime(() => {});

    expect(addSpy.mock.calls.filter(([type]) => type === "resize")).toHaveLength(1);
    expect(addSpy.mock.calls.filter(([type]) => type === "orientationchange")).toHaveLength(1);

    unsubscribeA();
    unsubscribeB();

    expect(removeSpy.mock.calls.filter(([type]) => type === "resize")).toHaveLength(1);
    expect(removeSpy.mock.calls.filter(([type]) => type === "orientationchange")).toHaveLength(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
