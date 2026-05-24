import "@/lib/runtime-storage";
import { type ThemeMode, coerceTheme, writeStoredJson, removeStoredKey } from "./state-normalization";
import { emitAppSync, subscribeAppSync } from "./app-sync";

export const THEME_STORAGE_KEY = "gct-theme";
export const LEGACY_THEME_STORAGE_KEY = "nge-theme";
export const THEME_RUNTIME_SYNC_KEYS = [THEME_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY];

export interface ThemeRuntimeSnapshot {
  mode: ThemeMode;
  className: string;
  colorScheme: ThemeMode;
  surfaceTone: "bright" | "dim";
  contrastTone: "soft" | "strong";
  tokenInheritance: "root" | "body";
  updatedAt: string;
}

const isBrowser = () => typeof window !== "undefined";

export function normalizeThemeMode(value: unknown, fallback: ThemeMode = "light"): ThemeMode {
  return coerceTheme(value, fallback);
}

export function getThemeRuntimeSnapshot(input: Partial<ThemeRuntimeSnapshot> & Record<string, unknown> = {}): ThemeRuntimeSnapshot {
  const mode = normalizeThemeMode(input.mode ?? readLegacyThemeMode());
  return {
    mode,
    className: mode === "dark" ? "dark" : "",
    colorScheme: mode,
    surfaceTone: mode === "dark" ? "dim" : "bright",
    contrastTone: mode === "dark" ? "strong" : "soft",
    tokenInheritance: "root",
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : new Date().toISOString(),
  };
}

export function readLegacyThemeMode(): ThemeMode {
  if (!isBrowser()) return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function readThemeSnapshot(): ThemeRuntimeSnapshot {
  return getThemeRuntimeSnapshot({ mode: readLegacyThemeMode() });
}

export function applyThemeSnapshot(snapshot: ThemeRuntimeSnapshot) {
  if (!isBrowser()) return;
  const root = document.documentElement;
  root.classList.toggle("dark", snapshot.mode === "dark");
  root.setAttribute("data-theme", snapshot.mode);
  root.dataset.themeMode = snapshot.mode;
  root.dataset.themeSurface = snapshot.surfaceTone;
  root.dataset.themeContrast = snapshot.contrastTone;
  root.dataset.themeInheritance = snapshot.tokenInheritance;
  document.body.dataset.themeMode = snapshot.mode;
  document.body.dataset.themeSurface = snapshot.surfaceTone;
  document.body.dataset.themeContrast = snapshot.contrastTone;
}

export function persistThemeSnapshot(snapshot: ThemeRuntimeSnapshot) {
  if (!isBrowser()) return;
  writeStoredJson(THEME_STORAGE_KEY, snapshot.mode);
  writeStoredJson(LEGACY_THEME_STORAGE_KEY, snapshot.mode);
  emitAppSync(THEME_STORAGE_KEY);
}

export function setThemeMode(mode: ThemeMode): ThemeRuntimeSnapshot {
  const current = readThemeSnapshot();
  const normalized = normalizeThemeMode(mode);
  if (current.mode === normalized) return current;
  const snapshot = getThemeRuntimeSnapshot({ mode: normalized });
  applyThemeSnapshot(snapshot);
  persistThemeSnapshot(snapshot);
  return snapshot;
}

export function subscribeThemeRuntime(listener: () => void) {
  return subscribeAppSync(THEME_RUNTIME_SYNC_KEYS, listener);
}

export function clearThemeRuntimeStorage() {
  removeStoredKey(THEME_STORAGE_KEY);
  removeStoredKey(LEGACY_THEME_STORAGE_KEY);
  emitAppSync(THEME_STORAGE_KEY);
}
