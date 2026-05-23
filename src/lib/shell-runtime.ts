import { emitAppSync, subscribeAppSync } from "./app-sync";
import {
  normalizeShellState,
  readStoredJson,
  removeStoredKey,
  writeStoredJson,
  type LayoutMode,
  type ShellNormalizedState,
} from "./state-normalization";

export const SHELL_RUNTIME_STORAGE_KEY = "sms.shell.runtime.v1";
const THEME_STORAGE_KEY = "gct-theme";
const LEGACY_THEME_STORAGE_KEY = "nge-theme";
const SHELL_RUNTIME_SYNC_KEYS = [SHELL_RUNTIME_STORAGE_KEY, THEME_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY];

export interface ShellRuntimeSnapshot extends ShellNormalizedState {
  shellMode: LayoutMode;
}

const isBrowser = () => typeof window !== "undefined";

const detectLayoutMode = (): LayoutMode => {
  if (!isBrowser()) return "desktop";
  const viewportWidth = Math.max(Number(window.innerWidth || 0), Number(document.documentElement.clientWidth || 0));
  const finePointer = typeof window.matchMedia === "function"
    ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
    : true;
  return finePointer && viewportWidth > 1100 ? "desktop" : "mobile";
};

const readLegacyTheme = (): "light" | "dark" => {
  if (!isBrowser()) return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

const snapshotFromRaw = (raw: Partial<ShellRuntimeSnapshot> & Record<string, unknown> = {}): ShellRuntimeSnapshot => {
  const normalized = normalizeShellState({
    focus: raw.focus,
    fabOpen: raw.fabOpen,
    theme: raw.theme ?? readLegacyTheme(),
    layoutMode: raw.layoutMode ?? raw.shellMode ?? detectLayoutMode(),
    sidebarCollapsed: raw.sidebarCollapsed,
    updatedAt: raw.updatedAt,
  });

  return {
    ...normalized,
    shellMode: normalized.layoutMode,
  };
};

const readStoredSnapshot = (): Partial<ShellRuntimeSnapshot> => readStoredJson<Partial<ShellRuntimeSnapshot>>(SHELL_RUNTIME_STORAGE_KEY, {});

export function getShellRuntimeSnapshot(): ShellRuntimeSnapshot {
  return snapshotFromRaw(readStoredSnapshot());
}

function applySnapshot(snapshot: ShellRuntimeSnapshot) {
  if (!isBrowser()) return;
  const root = document.documentElement;
  root.classList.toggle("dark", snapshot.theme === "dark");
  root.setAttribute("data-theme", snapshot.theme);
  root.dataset.sidebarMode = snapshot.shellMode;
  root.dataset.focusMode = snapshot.focus ? "on" : "off";
  root.classList.toggle("preboot-desktop-mode", snapshot.shellMode === "desktop");
  root.classList.toggle("preboot-mobile-mode", snapshot.shellMode === "mobile");
  document.body.classList.toggle("app-focus-enabled", snapshot.focus);
  document.body.dataset.shellMode = snapshot.shellMode;
}

function persistSnapshot(snapshot: ShellRuntimeSnapshot) {
  if (!isBrowser()) return;
  const next = { ...snapshot, updatedAt: new Date().toISOString() };
  writeStoredJson(SHELL_RUNTIME_STORAGE_KEY, next);
  writeStoredJson(THEME_STORAGE_KEY, next.theme);
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
  const next = snapshotFromRaw({
    ...current,
    ...patch,
    layoutMode: patch.layoutMode ?? patch.shellMode ?? current.layoutMode,
  });
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
  const handleResize = () => {
    const before = getShellRuntimeSnapshot();
    const after = refreshShellLayoutMode();
    if (before.layoutMode !== after.layoutMode) listener();
  };

  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);

  return () => {
    unsubscribeSync();
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("orientationchange", handleResize);
  };
}

export function clearShellRuntimeStorage() {
  removeStoredKey(SHELL_RUNTIME_STORAGE_KEY);
  removeStoredKey(THEME_STORAGE_KEY);
  emitAppSync(SHELL_RUNTIME_STORAGE_KEY);
}
