import { create } from "zustand";
import type { TraceCategory } from "./activityTrace";

const STORAGE_KEY = "sms.traceConfig";

export interface TraceConfig {
  enabled: boolean;
  startExpanded: boolean;
  autoCollapse: boolean;
  showBadge: boolean;
  autoCollapseDelay: number;
  maxEvents: number;
  captureCategories: TraceCategory[];
}

const DEFAULTS: TraceConfig = {
  enabled: true,
  startExpanded: true,
  autoCollapse: true,
  showBadge: true,
  autoCollapseDelay: 6000,
  maxEvents: 260,
  captureCategories: ["system", "navigation", "action", "field", "persistence", "sync", "alert"],
};

function loadFromStorage(): TraceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<TraceConfig>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveToStorage(config: TraceConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* quota exceeded etc */ }
}

interface TraceConfigState extends TraceConfig {
  resetToDefaults: () => void;
  update: (patch: Partial<TraceConfig>) => void;
}

const initial = loadFromStorage();

export const useTraceConfig = create<TraceConfigState>((set) => ({
  ...initial,
  resetToDefaults: () => {
    set(DEFAULTS);
    saveToStorage(DEFAULTS);
  },
  update: (patch) => {
    set((s) => {
      const next = { ...s, ...patch };
      saveToStorage(next);
      return next;
    });
  },
}));

// Keep zustand store in sync when profile system writes to sms.traceConfig
if (typeof window !== "undefined") {
  window.addEventListener("sms:trace-config-changed", ((e: CustomEvent) => {
    useTraceConfig.setState(e.detail);
  }) as EventListener);
}
