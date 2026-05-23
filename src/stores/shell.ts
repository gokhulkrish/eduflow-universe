import { create } from "zustand";
import { getShellRuntimeSnapshot, setShellRuntimeSnapshot, type ShellRuntimeSnapshot } from "@/lib/shell-runtime";

const initialShell = getShellRuntimeSnapshot();

interface ShellState {
  focus: boolean;
  fabOpen: boolean;
  theme: "light" | "dark";
  layoutMode: "desktop" | "mobile";
  toggleFocus: () => void;
  setFabOpen: (o: boolean) => void;
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
  syncFromRuntime: (snapshot: ShellRuntimeSnapshot) => void;
}

export const useShell = create<ShellState>((set, get) => ({
  focus: initialShell.focus,
  fabOpen: initialShell.fabOpen,
  theme: initialShell.theme,
  layoutMode: initialShell.layoutMode,
  toggleFocus: () => {
    const focus = !get().focus;
    const snapshot = setShellRuntimeSnapshot({ focus, sidebarCollapsed: focus });
    set({ focus: snapshot.focus, layoutMode: snapshot.layoutMode, theme: snapshot.theme, fabOpen: snapshot.fabOpen });
  },
  setFabOpen: (fabOpen) => {
    const snapshot = setShellRuntimeSnapshot({ fabOpen });
    set({ fabOpen: snapshot.fabOpen, layoutMode: snapshot.layoutMode, theme: snapshot.theme, focus: snapshot.focus });
  },
  setTheme: (theme) => {
    const snapshot = setShellRuntimeSnapshot({ theme });
    set({ theme: snapshot.theme, layoutMode: snapshot.layoutMode, focus: snapshot.focus, fabOpen: snapshot.fabOpen });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
  syncFromRuntime: (snapshot) => set({
    focus: snapshot.focus,
    fabOpen: snapshot.fabOpen,
    theme: snapshot.theme,
    layoutMode: snapshot.layoutMode,
  }),
}));
