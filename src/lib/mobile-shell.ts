import { emitAppSync, subscribeAppSync } from "./app-sync";
import { runSingletonEffect } from "./module-deduplication";

export interface MobileShellSnapshot {
  isMobile: boolean;
  touchCapable: boolean;
  viewportWidth: number;
  viewportHeight: number;
  overflowLocked: boolean;
  overlayLocks: number;
  updatedAt: string;
}

type StyleSnapshot = {
  overflow: string;
  overscrollBehavior: string;
  touchAction: string;
  webkitOverflowScrolling: string;
};

const MOBILE_BREAKPOINT = 768;
export const MOBILE_SHELL_RUNTIME_SYNC_KEY = "sms.mobile-shell.v1";

const isBrowser = () => typeof window !== "undefined";

let currentSnapshot: MobileShellSnapshot | null = null;
let overlayLocks = 0;
let restoreStyles: StyleSnapshot | null = null;

const readViewport = () => {
  if (!isBrowser()) {
    return { width: 0, height: 0 };
  }

  const visualViewport = window.visualViewport;
  const width = Math.max(
    Number(visualViewport?.width || 0),
    Number(window.innerWidth || 0),
    Number(document.documentElement.clientWidth || 0),
  );
  const height = Math.max(
    Number(visualViewport?.height || 0),
    Number(window.innerHeight || 0),
    Number(document.documentElement.clientHeight || 0),
  );

  return { width, height };
};

const readTouchCapability = () => {
  if (!isBrowser()) return false;
  const coarsePointer = typeof window.matchMedia === "function"
    ? window.matchMedia("(pointer: coarse)").matches
    : false;
  const hasTouch = typeof navigator !== "undefined" && Number(navigator.maxTouchPoints || 0) > 0;
  return coarsePointer || hasTouch || "ontouchstart" in window;
};

const buildSnapshot = (): MobileShellSnapshot => {
  const viewport = readViewport();
  const touchCapable = readTouchCapability();
  const isMobile = viewport.width < MOBILE_BREAKPOINT || (touchCapable && viewport.width < 1024);

  return {
    isMobile,
    touchCapable,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    overflowLocked: isMobile && overlayLocks > 0,
    overlayLocks,
    updatedAt: new Date().toISOString(),
  };
};

const getBodyStyle = () => document.body.style as CSSStyleDeclaration & { webkitOverflowScrolling?: string };

const captureBodyStyles = () => {
  const bodyStyle = getBodyStyle();
  restoreStyles = {
    overflow: bodyStyle.overflow,
    overscrollBehavior: bodyStyle.overscrollBehavior,
    touchAction: bodyStyle.touchAction,
    webkitOverflowScrolling: bodyStyle.webkitOverflowScrolling ?? "",
  };
};

const restoreBodyStyles = () => {
  if (!restoreStyles) return;
  const bodyStyle = getBodyStyle();
  bodyStyle.overflow = restoreStyles.overflow;
  bodyStyle.overscrollBehavior = restoreStyles.overscrollBehavior;
  bodyStyle.touchAction = restoreStyles.touchAction;
  bodyStyle.webkitOverflowScrolling = restoreStyles.webkitOverflowScrolling;
  restoreStyles = null;
};

function applySnapshot(snapshot: MobileShellSnapshot) {
  if (!isBrowser()) return;

  const root = document.documentElement;
  const body = document.body;
  const bodyStyle = getBodyStyle();
  const overflowMode = snapshot.overflowLocked ? "locked" : "free";

  currentSnapshot = snapshot;
  root.dataset.mobileShell = snapshot.isMobile ? "on" : "off";
  root.dataset.mobileTouch = snapshot.touchCapable ? "on" : "off";
  root.dataset.mobileOverflow = overflowMode;
  root.dataset.mobileViewport = snapshot.isMobile ? "compact" : "wide";
  root.style.setProperty("--mobile-vh", `${snapshot.viewportHeight}px`);
  root.style.setProperty("--mobile-vw", `${snapshot.viewportWidth}px`);

  body.dataset.mobileShell = snapshot.isMobile ? "on" : "off";
  body.dataset.mobileTouch = snapshot.touchCapable ? "on" : "off";
  body.dataset.mobileOverflow = overflowMode;
  body.classList.toggle("mobile-shell-active", snapshot.isMobile);
  body.classList.toggle("mobile-shell-touch", snapshot.touchCapable);
  body.classList.toggle("mobile-shell-locked", snapshot.overflowLocked);
  body.style.setProperty("--mobile-vh", `${snapshot.viewportHeight}px`);
  body.style.setProperty("--mobile-vw", `${snapshot.viewportWidth}px`);
  emitAppSync(MOBILE_SHELL_RUNTIME_SYNC_KEY);

  if (snapshot.overflowLocked) {
    if (!restoreStyles) captureBodyStyles();
    bodyStyle.overflow = "hidden";
    bodyStyle.overscrollBehavior = "none";
    bodyStyle.webkitOverflowScrolling = "auto";
    return;
  }

  restoreBodyStyles();
}

function refreshMobileShellRuntime() {
  applySnapshot(buildSnapshot());
  return currentSnapshot!;
}

function handleViewportChange() {
  refreshMobileShellRuntime();
}

export function getMobileShellSnapshot(): MobileShellSnapshot {
  if (currentSnapshot) return currentSnapshot;
  return buildSnapshot();
}

export function bootstrapMobileShellRuntime() {
  if (!isBrowser()) return getMobileShellSnapshot();

  runSingletonEffect("bootstrap:mobile-shell", "Mobile shell listeners", "utility", () => {
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);
  });

  return refreshMobileShellRuntime();
}

export function acquireMobileScrollLock() {
  overlayLocks += 1;
  refreshMobileShellRuntime();
  let released = false;

  return () => {
    if (released) return;
    released = true;
    overlayLocks = Math.max(0, overlayLocks - 1);
    refreshMobileShellRuntime();
  };
}

export function refreshMobileShellViewport() {
  return refreshMobileShellRuntime();
}

export function clearMobileShellRuntime() {
  overlayLocks = 0;
  currentSnapshot = null;
  restoreBodyStyles();
  if (!isBrowser()) return;

  const root = document.documentElement;
  const body = document.body;
  root.removeAttribute("data-mobile-shell");
  root.removeAttribute("data-mobile-touch");
  root.removeAttribute("data-mobile-overflow");
  root.removeAttribute("data-mobile-viewport");
  root.style.removeProperty("--mobile-vh");
  root.style.removeProperty("--mobile-vw");
  body.removeAttribute("data-mobile-shell");
  body.removeAttribute("data-mobile-touch");
  body.removeAttribute("data-mobile-overflow");
  body.classList.remove("mobile-shell-active", "mobile-shell-touch", "mobile-shell-locked");
  body.style.removeProperty("--mobile-vh");
  body.style.removeProperty("--mobile-vw");
  emitAppSync(MOBILE_SHELL_RUNTIME_SYNC_KEY);
}

export function subscribeMobileShellRuntime(listener: () => void) {
  return subscribeAppSync([MOBILE_SHELL_RUNTIME_SYNC_KEY], listener);
}
