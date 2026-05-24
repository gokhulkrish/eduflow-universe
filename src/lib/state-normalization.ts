import "@/lib/runtime-storage";
export type ThemeMode = "light" | "dark";
export type LayoutMode = "desktop" | "mobile";

const coerceString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const coerceBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  }
  return fallback;
};

const coerceTheme = (value: unknown, fallback: ThemeMode): ThemeMode => {
  const normalized = coerceString(value, fallback).toLowerCase();
  return normalized === "dark" ? "dark" : "light";
};

const coerceLayoutMode = (value: unknown, fallback: LayoutMode): LayoutMode => {
  const normalized = coerceString(value, fallback).toLowerCase();
  return normalized === "mobile" ? "mobile" : "desktop";
};

const coerceStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => coerceString(entry)).filter(Boolean);
};

export interface ShellNormalizedState {
  focus: boolean;
  fabOpen: boolean;
  theme: ThemeMode;
  layoutMode: LayoutMode;
  sidebarCollapsed: boolean;
  updatedAt: string;
}

export interface WorkspaceNormalizedState {
  workspaceKey: string;
  subviewKey: string;
  searchQuery: string;
  updatedAt: string;
}

export interface RegistryNormalizedState {
  activeRegistryKey: string;
  inspectorOpen: boolean;
  selectedItemKey: string;
  filters: string[];
  updatedAt: string;
}

export interface PanelVisibilityState {
  activePanelKey: string;
  openPanels: string[];
  modalOpen: boolean;
  updatedAt: string;
}

export interface SettingsNormalizedState {
  activeSectionKey: string;
  activeTabKey: string;
  sidebarCollapsed: boolean;
  updatedAt: string;
}

export interface ContextNormalizedState {
  contextKey: string;
  scopeKey: string;
  routeKey: string;
  updatedAt: string;
}

export function normalizeShellState(input: Partial<ShellNormalizedState> & Record<string, unknown> = {}): ShellNormalizedState {
  const theme = coerceTheme(input.theme, "light");
  const layoutMode = coerceLayoutMode(input.layoutMode, "desktop");
  const focus = coerceBoolean(input.focus, false);
  const fabOpen = coerceBoolean(input.fabOpen, false);
  const sidebarCollapsed = coerceBoolean(input.sidebarCollapsed, focus || layoutMode === "mobile");

  return {
    focus,
    fabOpen,
    theme,
    layoutMode,
    sidebarCollapsed,
    updatedAt: coerceString(input.updatedAt) || new Date().toISOString(),
  };
}

export function normalizeWorkspaceState(input: Partial<WorkspaceNormalizedState> & Record<string, unknown> = {}): WorkspaceNormalizedState {
  return {
    workspaceKey: coerceString(input.workspaceKey, "home"),
    subviewKey: coerceString(input.subviewKey),
    searchQuery: coerceString(input.searchQuery),
    updatedAt: coerceString(input.updatedAt) || new Date().toISOString(),
  };
}

export function normalizeRegistryState(input: Partial<RegistryNormalizedState> & Record<string, unknown> = {}): RegistryNormalizedState {
  return {
    activeRegistryKey: coerceString(input.activeRegistryKey, "default"),
    inspectorOpen: coerceBoolean(input.inspectorOpen, false),
    selectedItemKey: coerceString(input.selectedItemKey),
    filters: coerceStringArray(input.filters),
    updatedAt: coerceString(input.updatedAt) || new Date().toISOString(),
  };
}

export function normalizePanelVisibilityState(input: Partial<PanelVisibilityState> & Record<string, unknown> = {}): PanelVisibilityState {
  return {
    activePanelKey: coerceString(input.activePanelKey),
    openPanels: coerceStringArray(input.openPanels),
    modalOpen: coerceBoolean(input.modalOpen, false),
    updatedAt: coerceString(input.updatedAt) || new Date().toISOString(),
  };
}

export function normalizeSettingsState(input: Partial<SettingsNormalizedState> & Record<string, unknown> = {}): SettingsNormalizedState {
  return {
    activeSectionKey: coerceString(input.activeSectionKey, "general"),
    activeTabKey: coerceString(input.activeTabKey),
    sidebarCollapsed: coerceBoolean(input.sidebarCollapsed, false),
    updatedAt: coerceString(input.updatedAt) || new Date().toISOString(),
  };
}

export function normalizeContextState(input: Partial<ContextNormalizedState> & Record<string, unknown> = {}): ContextNormalizedState {
  return {
    contextKey: coerceString(input.contextKey, "global"),
    scopeKey: coerceString(input.scopeKey),
    routeKey: coerceString(input.routeKey),
    updatedAt: coerceString(input.updatedAt) || new Date().toISOString(),
  };
}

export function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeStoredKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export { coerceBoolean, coerceLayoutMode, coerceString, coerceTheme, coerceStringArray };
