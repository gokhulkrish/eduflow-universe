import { afterEach, describe, expect, it } from "vitest";
import {
  acquireMobileScrollLock,
  bootstrapMobileShellRuntime,
  clearMobileShellRuntime,
  getMobileShellSnapshot,
  refreshMobileShellViewport,
} from "./mobile-shell";

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width, writable: true });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height, writable: true });
  Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: width, writable: true });
  Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: height, writable: true });
};

describe("mobile shell", () => {
  afterEach(() => {
    clearMobileShellRuntime();
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 0 });
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-mobile-shell");
    document.documentElement.removeAttribute("data-mobile-touch");
    document.documentElement.removeAttribute("data-mobile-overflow");
    document.documentElement.removeAttribute("data-mobile-viewport");
    document.documentElement.style.cssText = "";
    document.body.className = "";
    document.body.removeAttribute("data-mobile-shell");
    document.body.removeAttribute("data-mobile-touch");
    document.body.removeAttribute("data-mobile-overflow");
    document.body.style.cssText = "";
  });

  it("tracks mobile viewport state and lock lifecycle", () => {
    setViewport(480, 900);
    const snapshot = bootstrapMobileShellRuntime();
    expect(snapshot.isMobile).toBe(true);
    expect(document.body.classList.contains("mobile-shell-active")).toBe(true);

    const release = acquireMobileScrollLock();
    expect(getMobileShellSnapshot().overflowLocked).toBe(true);
    expect(document.body.classList.contains("mobile-shell-locked")).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    release();
    expect(getMobileShellSnapshot().overflowLocked).toBe(false);
    expect(document.body.classList.contains("mobile-shell-locked")).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("refreshes when the viewport becomes desktop sized", () => {
    setViewport(480, 900);
    bootstrapMobileShellRuntime();
    expect(getMobileShellSnapshot().isMobile).toBe(true);

    setViewport(1280, 900);
    refreshMobileShellViewport();
    expect(getMobileShellSnapshot().isMobile).toBe(false);
  });

  it("treats touch tablets under 1024px as mobile", () => {
    setViewport(900, 1200);
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 5 });

    const snapshot = bootstrapMobileShellRuntime();

    expect(snapshot.isMobile).toBe(true);
    expect(snapshot.touchCapable).toBe(true);
    expect(document.documentElement.dataset.mobileViewport).toBe("compact");
  });
});
