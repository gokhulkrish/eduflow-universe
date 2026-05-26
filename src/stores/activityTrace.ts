import { create } from "zustand";
import { generateId } from "@/lib/import-engine/core";

export type TraceCategory = "system" | "navigation" | "action" | "field" | "persistence" | "sync" | "alert";

export interface TraceEvent {
  id: string;
  ts: number;
  category: TraceCategory;
  title: string;
  detail?: string;
  source?: string;
  section?: string;
}

interface TraceState {
  events: TraceEvent[];
  open: boolean;
  filter: TraceCategory | "all";
  query: string;
  push: (e: Omit<TraceEvent, "id" | "ts">) => void;
  clear: () => void;
  setOpen: (o: boolean) => void;
  setFilter: (f: TraceCategory | "all") => void;
  setQuery: (q: string) => void;
}

function readConfig() {
  try {
    const raw = localStorage.getItem("sms.traceConfig");
    if (!raw) return null;
    return JSON.parse(raw) as { enabled: boolean; captureCategories: TraceCategory[]; maxEvents: number };
  } catch {
    return null;
  }
}

function buildSeedEvents(): TraceEvent[] {
  const cfg = readConfig();
  if (!cfg) return [];
  if (!cfg.enabled) return [];
  return ([
    { id: "1", ts: Date.now() - 60_000 * 8, category: "system", title: "Workspace booted", detail: "SMS shell initialized", source: "shell" },
    { id: "2", ts: Date.now() - 60_000 * 6, category: "sync", title: "Legacy SIS sync resumed", detail: "412K / 528K records", source: "migration" },
    { id: "3", ts: Date.now() - 60_000 * 4, category: "navigation", title: "Dashboard opened", section: "/" },
    { id: "4", ts: Date.now() - 60_000 * 2, category: "alert", title: "Compatibility advisory", detail: "Core ERP v4.9.0 requires Payment Gateway v3.2.0+" },
    { id: "5", ts: Date.now() - 30_000, category: "action", title: "Pipeline triggered", detail: "Admission → Parent Notification", source: "automation" },
  ] as TraceEvent[]).filter((e) => cfg.captureCategories.includes(e.category));
}

export const useActivityTrace = create<TraceState>((set) => ({
  events: buildSeedEvents(),
  open: false,
  filter: "all",
  query: "",
  push: (e) => {
    const cfg = readConfig();
    if (!cfg) {
      set((s) => ({
        events: [{ ...e, id: generateId(), ts: Date.now() }, ...s.events].slice(0, 500),
      }));
      return;
    }
    if (!cfg.enabled) return;
    if (!cfg.captureCategories.includes(e.category)) return;
    set((s) => ({
      events: [{ ...e, id: generateId(), ts: Date.now() }, ...s.events].slice(0, cfg.maxEvents),
    }));
  },
  clear: () => set({ events: [] }),
  setOpen: (open) => set({ open }),
  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),
}));
