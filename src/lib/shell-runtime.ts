import { emitAppSync, subscribeAppSync } from "./app-sync";
import { normalizeFocusMode, type FocusMode } from "./focus-mode";
import {
  applyThemeSnapshot,
  clearThemeRuntimeStorage,
  readLegacyThemeMode,
  setThemeMode,
  THEME_RUNTIME_SYNC_KEYS,
  type ThemeRuntimeSnapshot,
} from "./theme-runtime";
import {
  normalizeShellState,
  readStoredJson,
  removeStoredKey,
  writeStoredJson,
  type LayoutMode,
  type ShellNormalizedState,
} from "./state-normalization";

export const SHELL_RUNTIME_STORAGE_KEY = "sms.shell.runtime.v1";
const SHELL_RUNTIME_SYNC_KEYS = [SHELL_RUNTIME_STORAGE_KEY, ...THEME_RUNTIME_SYNC_KEYS];

export interface ShellRuntimeSnapshot extends ShellNormalizedState {
  shellMode: LayoutMode;
  focusMode: FocusMode;
}

const isBrowser = () => typeof window !== "undefined";
let shellRuntimeListenersInstalled = false;
let shellRuntimeSubscriberCount = 0;
const handleShellRuntimeResize = () => {
  refreshShellLayoutMode();
};

const detectLayoutMode = (): LayoutMode => {
  if (!isBrowser()) return "desktop";
  const viewportWidth = Math.max(Number(window.innerWidth || 0), Number(document.documentElement.clientWidth || 0));
  const finePointer = typeof window.matchMedia === "function"
    ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
    : true;
  return finePointer && viewportWidth > 1100 ? "desktop" : "mobile";
};

const readLegacyTheme = (): "light" | "dark" => {
  return readLegacyThemeMode();
};

const snapshotFromRaw = (raw: Partial<ShellRuntimeSnapshot> & Record<string, unknown> = {}): ShellRuntimeSnapshot => {
  const focusMode = normalizeFocusMode(raw.focusMode ?? (raw.focus ? "focus" : "off"));
  const normalized = normalizeShellState({
    focus: focusMode !== "off",
    fabOpen: raw.fabOpen,
    theme: raw.theme ?? readLegacyTheme(),
    layoutMode: raw.layoutMode ?? raw.shellMode ?? detectLayoutMode(),
    sidebarCollapsed: raw.sidebarCollapsed,
    updatedAt: raw.updatedAt,
  });

  return {
    ...normalized,
    shellMode: normalized.layoutMode,
    focusMode,
  };
};

const readStoredSnapshot = (): Partial<ShellRuntimeSnapshot> => readStoredJson<Partial<ShellRuntimeSnapshot>>(SHELL_RUNTIME_STORAGE_KEY, {});

export function getShellRuntimeSnapshot(): ShellRuntimeSnapshot {
  return snapshotFromRaw(readStoredSnapshot());
}

function applySnapshot(snapshot: ShellRuntimeSnapshot) {
  if (!isBrowser()) return;
  const focusCompression = snapshot.focusMode === "deep" ? "compressed" : snapshot.focusMode === "focus" ? "balanced" : "off";
  applyThemeSnapshot({
    mode: snapshot.theme,
    className: snapshot.theme === "dark" ? "dark" : "",
    colorScheme: snapshot.theme,
    surfaceTone: snapshot.theme === "dark" ? "dim" : "bright",
    contrastTone: snapshot.theme === "dark" ? "strong" : "soft",
    tokenInheritance: "root",
    updatedAt: snapshot.updatedAt,
  } satisfies ThemeRuntimeSnapshot);
  const root = document.documentElement;
  root.dataset.sidebarMode = snapshot.shellMode;
  root.dataset.focusMode = snapshot.focusMode;
  root.dataset.focusCompression = focusCompression;
  root.classList.toggle("preboot-desktop-mode", snapshot.shellMode === "desktop");
  root.classList.toggle("preboot-mobile-mode", snapshot.shellMode === "mobile");
  document.body.classList.toggle("app-focus-enabled", snapshot.focusMode !== "off");
  document.body.classList.toggle("app-focus-reduced-noise", snapshot.focusMode !== "off");
  document.body.classList.toggle("app-focus-workspace-minimized", snapshot.focusMode !== "off");
  document.body.classList.toggle("app-focus-deep", snapshot.focusMode === "deep");
  document.body.classList.toggle("app-focus-compressed", snapshot.focusMode === "deep");
  document.body.dataset.focusMode = snapshot.focusMode;
  document.body.dataset.focusCompression = focusCompression;
  document.body.dataset.shellMode = snapshot.shellMode;
}

function persistSnapshot(snapshot: ShellRuntimeSnapshot) {
  if (!isBrowser()) return;
  const next = { ...snapshot, updatedAt: new Date().toISOString() };
  writeStoredJson(SHELL_RUNTIME_STORAGE_KEY, next);
  setThemeMode(next.theme);
  emitAppSync(SHELL_RUNTIME_STORAGE_KEY);
}

export function bootstrapShellRuntime() {
  if (!isBrowser()) return getShellRuntimeSnapshot();
  const snapshot = getShellRuntimeSnapshot();
  document.documentElement.classList.add("shell-booting");
  applySnapshot(snapshot);
  const release = () => document.documentElement.classList.remove("shell-booting");
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(release));
  } else {
    window.setTimeout(release, 32);
  }
  return snapshot;
}

export function setShellRuntimeSnapshot(patch: Partial<ShellRuntimeSnapshot>): ShellRuntimeSnapshot {
  const current = getShellRuntimeSnapshot();
  const hasFocusModePatch = Object.prototype.hasOwnProperty.call(patch, "focusMode");
  const hasFocusPatch = Object.prototype.hasOwnProperty.call(patch, "focus");
  const nextFocusMode = hasFocusModePatch
    ? normalizeFocusMode(patch.focusMode, current.focusMode)
    : hasFocusPatch
      ? (patch.focus ? (current.focusMode === "deep" ? "deep" : "focus") : "off")
      : current.focusMode;
  const next = snapshotFromRaw({
    ...current,
    ...patch,
    focusMode: nextFocusMode,
    focus: nextFocusMode !== "off",
    layoutMode: patch.layoutMode ?? patch.shellMode ?? current.layoutMode,
  });
  if (
    current.focus === next.focus &&
    current.focusMode === next.focusMode &&
    current.fabOpen === next.fabOpen &&
    current.theme === next.theme &&
    current.layoutMode === next.layoutMode &&
    current.shellMode === next.shellMode &&
    current.sidebarCollapsed === next.sidebarCollapsed
  ) {
    return current;
  }
  applySnapshot(next);
  persistSnapshot(next);
  return next;
}

export function refreshShellLayoutMode() {
  if (!isBrowser()) return getShellRuntimeSnapshot();
  const current = getShellRuntimeSnapshot();
  const nextLayout = detectLayoutMode();
  if (current.layoutMode === nextLayout) return current;
  return setShellRuntimeSnapshot({ layoutMode: nextLayout, shellMode: nextLayout });
}

export function subscribeShellRuntime(listener: () => void) {
  if (!isBrowser()) return () => {};

  const unsubscribeSync = subscribeAppSync(SHELL_RUNTIME_SYNC_KEYS, listener);

  if (!shellRuntimeListenersInstalled) {
    window.addEventListener("resize", handleShellRuntimeResize);
    window.addEventListener("orientationchange", handleShellRuntimeResize);
    shellRuntimeListenersInstalled = true;
  }
  shellRuntimeSubscriberCount += 1;

  return () => {
    unsubscribeSync();
    shellRuntimeSubscriberCount = Math.max(0, shellRuntimeSubscriberCount - 1);
    if (shellRuntimeSubscriberCount === 0 && shellRuntimeListenersInstalled) {
      window.removeEventListener("resize", handleShellRuntimeResize);
      window.removeEventListener("orientationchange", handleShellRuntimeResize);
      shellRuntimeListenersInstalled = false;
    }
  };
}

export function clearShellRuntimeStorage() {
  removeStoredKey(SHELL_RUNTIME_STORAGE_KEY);
  clearThemeRuntimeStorage();
  emitAppSync(SHELL_RUNTIME_STORAGE_KEY);
}
