import { afterEach, describe, expect, it } from "vitest";
import {
  applyThemeSnapshot,
  clearThemeRuntimeStorage,
  getThemeRuntimeSnapshot,
  normalizeThemeMode,
  readThemeSnapshot,
  setThemeMode,
} from "./theme-runtime";

describe("theme runtime", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-mode");
    document.documentElement.removeAttribute("data-theme-surface");
    document.documentElement.removeAttribute("data-theme-contrast");
    document.documentElement.removeAttribute("data-theme-inheritance");
    document.body.removeAttribute("data-theme-mode");
    document.body.removeAttribute("data-theme-surface");
    document.body.removeAttribute("data-theme-contrast");
    clearThemeRuntimeStorage();
  });

  it("normalizes theme tokens and applies runtime attributes", () => {
    expect(normalizeThemeMode("Dark")).toBe("dark");
    const snapshot = setThemeMode("dark");
    expect(snapshot.mode).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.themeMode).toBe("dark");
    expect(document.documentElement.dataset.themeSurface).toBe("dim");
    expect(document.body.dataset.themeContrast).toBe("strong");
  });

  it("reads persisted theme snapshots from storage", () => {
    setThemeMode("light");
    const snapshot = readThemeSnapshot();
    expect(snapshot.mode).toBe("light");
    expect(getThemeRuntimeSnapshot({ mode: "dark" }).surfaceTone).toBe("dim");
  });
});

