import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emitAppSync } from "@/lib/app-sync";

export const REGISTERED_RIBBON_STORAGE_KEY = "sms.registered-ribbon.v1";

export type RibbonTab = "home" | "data" | "insert" | "review" | "importExport" | "advanced" | "admin";

export type ViewMode = "grid" | "card" | "split";

export type FilterConfig = {
  key: string;
  label: string;
  type: "select" | "text";
  mapTo: string;
};

export interface ClipboardState {
  studentId: string | null;
  snapshot: Record<string, string> | null;
}

export interface RegisteredRibbonState {
  activeTab: RibbonTab;
  viewMode: ViewMode;
  compact: boolean;
  wrap: boolean;
  freezeFirst: boolean;
  freezeActions: boolean;
  banded: boolean;
  focus: boolean;
  highlightMissing: boolean;
  gridLines: boolean;
  rowStripes: boolean;
  detailExpanded: boolean;
  sortField: string;
  sortDirection: "asc" | "desc";
  clipboard: ClipboardState;
  selectedFilterKeys: string[];
  filterConfig: Record<string, FilterConfig>;

  setActiveTab: (tab: RibbonTab) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleCompact: () => void;
  toggleWrap: () => void;
  toggleFreezeFirst: () => void;
  toggleFreezeActions: () => void;
  toggleBanded: () => void;
  toggleFocus: () => void;
  toggleHighlightMissing: () => void;
  toggleGridLines: () => void;
  toggleRowStripes: () => void;
  toggleDetailExpanded: () => void;
  setSortField: (field: string) => void;
  setSortDirection: (dir: "asc" | "desc") => void;
  setClipboard: (state: ClipboardState) => void;
  clearClipboard: () => void;
  setSelectedFilterKeys: (keys: string[]) => void;
  setFilterConfig: (config: Record<string, FilterConfig>) => void;
}

export const useRegisteredRibbon = create<RegisteredRibbonState>()(
  persist(
    (set) => ({
      activeTab: "home",
      viewMode: "grid",
      compact: false,
      wrap: false,
      freezeFirst: false,
      freezeActions: false,
      banded: false,
      focus: false,
      highlightMissing: false,
      gridLines: true,
      rowStripes: true,
      detailExpanded: false,
      sortField: "name",
      sortDirection: "asc",
      clipboard: { studentId: null, snapshot: null },
      selectedFilterKeys: ["name", "class", "status", "gender"],
      filterConfig: {
        name: { key: "name", label: "Name", type: "text", mapTo: "display_name" },
        class: { key: "class", label: "Class / Section", type: "select", mapTo: "grade" },
        status: { key: "status", label: "Status", type: "select", mapTo: "status" },
        gender: { key: "gender", label: "Gender", type: "select", mapTo: "gender" },
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleCompact: () => set((s) => ({ compact: !s.compact })),
      toggleWrap: () => set((s) => ({ wrap: !s.wrap })),
      toggleFreezeFirst: () => set((s) => ({ freezeFirst: !s.freezeFirst })),
      toggleFreezeActions: () => set((s) => ({ freezeActions: !s.freezeActions })),
      toggleBanded: () => set((s) => ({ banded: !s.banded })),
      toggleFocus: () => set((s) => ({ focus: !s.focus })),
      toggleHighlightMissing: () => set((s) => ({ highlightMissing: !s.highlightMissing })),
      toggleGridLines: () => set((s) => ({ gridLines: !s.gridLines })),
      toggleRowStripes: () => set((s) => ({ rowStripes: !s.rowStripes })),
      toggleDetailExpanded: () => set((s) => ({ detailExpanded: !s.detailExpanded })),
      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (dir) => set({ sortDirection: dir }),
      setClipboard: (state) => set({ clipboard: state }),
      clearClipboard: () => set({ clipboard: { studentId: null, snapshot: null } }),
      setSelectedFilterKeys: (keys) => set({ selectedFilterKeys: keys }),
      setFilterConfig: (config) => set({ filterConfig: config }),
    }),
    {
      name: REGISTERED_RIBBON_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) emitAppSync(REGISTERED_RIBBON_STORAGE_KEY);
      },
    },
  ),
);

export const registeredRibbonUiState = {
  get activeTab() { return useRegisteredRibbon.getState().activeTab; },
  get compact() { return useRegisteredRibbon.getState().compact; },
  get wrap() { return useRegisteredRibbon.getState().wrap; },
  get freezeFirst() { return useRegisteredRibbon.getState().freezeFirst; },
  get freezeActions() { return useRegisteredRibbon.getState().freezeActions; },
  get banded() { return useRegisteredRibbon.getState().banded; },
  get focus() { return useRegisteredRibbon.getState().focus; },
  get highlightMissing() { return useRegisteredRibbon.getState().highlightMissing; },
  get gridLines() { return useRegisteredRibbon.getState().gridLines; },
  get rowStripes() { return useRegisteredRibbon.getState().rowStripes; },
  get detailExpanded() { return useRegisteredRibbon.getState().detailExpanded; },
  get sortField() { return useRegisteredRibbon.getState().sortField; },
  get sortDirection() { return useRegisteredRibbon.getState().sortDirection; },
  get clipboard() { return useRegisteredRibbon.getState().clipboard; },
  get selectedFilterKeys() { return useRegisteredRibbon.getState().selectedFilterKeys; },
  get filterConfig() { return useRegisteredRibbon.getState().filterConfig; },
};
