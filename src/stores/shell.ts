import { create } from "zustand";
import { getShellRuntimeSnapshot, setShellRuntimeSnapshot, type ShellRuntimeSnapshot } from "@/lib/shell-runtime";
import { cycleFocusMode as advanceFocusMode, toggleFocusMode as deriveToggleFocusMode, type FocusMode } from "@/lib/focus-mode";

const initialShell = getShellRuntimeSnapshot();

const sameShellState = (current: ShellState, next: Partial<ShellState>) =>
  current.focus === next.focus &&
  current.focusMode === next.focusMode &&
  current.fabOpen === next.fabOpen &&
  current.theme === next.theme &&
  current.layoutMode === next.layoutMode;

interface ShellState {
  focus: boolean;
  focusMode: FocusMode;
  fabOpen: boolean;
  theme: "light" | "dark";
  layoutMode: "desktop" | "mobile";
  toggleFocus: () => void;
  cycleFocusMode: () => void;
  setFocusMode: (mode: FocusMode) => void;
  setFabOpen: (o: boolean) => void;
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
  syncFromRuntime: (snapshot: ShellRuntimeSnapshot) => void;
}

export const useShell = create<ShellState>((set, get) => ({
  focus: initialShell.focus,
  focusMode: initialShell.focusMode,
  fabOpen: initialShell.fabOpen,
  theme: initialShell.theme,
  layoutMode: initialShell.layoutMode,
  toggleFocus: () => {
    const nextFocusMode = deriveToggleFocusMode(get().focusMode);
    const snapshot = setShellRuntimeSnapshot({ focusMode: nextFocusMode, focus: nextFocusMode !== "off", sidebarCollapsed: nextFocusMode !== "off" });
    const nextState = {
      focus: snapshot.focus,
      focusMode: snapshot.focusMode,
      layoutMode: snapshot.layoutMode,
      theme: snapshot.theme,
      fabOpen: snapshot.fabOpen,
    };
    if (!sameShellState(get(), nextState)) set(nextState);
  },
  cycleFocusMode: () => {
    const nextFocusMode = advanceFocusMode(get().focusMode);
    const snapshot = setShellRuntimeSnapshot({ focusMode: nextFocusMode, focus: nextFocusMode !== "off", sidebarCollapsed: nextFocusMode !== "off" });
    const nextState = {
      focus: snapshot.focus,
      focusMode: snapshot.focusMode,
      layoutMode: snapshot.layoutMode,
      theme: snapshot.theme,
      fabOpen: snapshot.fabOpen,
    };
    if (!sameShellState(get(), nextState)) set(nextState);
  },
  setFocusMode: (focusMode) => {
    const snapshot = setShellRuntimeSnapshot({ focusMode, focus: focusMode !== "off", sidebarCollapsed: focusMode !== "off" });
    const nextState = {
      focus: snapshot.focus,
      focusMode: snapshot.focusMode,
      layoutMode: snapshot.layoutMode,
      theme: snapshot.theme,
      fabOpen: snapshot.fabOpen,
    };
    if (!sameShellState(get(), nextState)) set(nextState);
  },
  setFabOpen: (fabOpen) => {
    const snapshot = setShellRuntimeSnapshot({ fabOpen });
    const nextState = { fabOpen: snapshot.fabOpen, layoutMode: snapshot.layoutMode, theme: snapshot.theme, focus: snapshot.focus, focusMode: snapshot.focusMode };
    if (!sameShellState(get(), nextState)) set(nextState);
  },
  setTheme: (theme) => {
    const snapshot = setShellRuntimeSnapshot({ theme });
    const nextState = { theme: snapshot.theme, layoutMode: snapshot.layoutMode, focus: snapshot.focus, focusMode: snapshot.focusMode, fabOpen: snapshot.fabOpen };
    if (!sameShellState(get(), nextState)) set(nextState);
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
  syncFromRuntime: (snapshot) => {
    const nextState = {
      focus: snapshot.focus,
      focusMode: snapshot.focusMode,
      fabOpen: snapshot.fabOpen,
      theme: snapshot.theme,
      layoutMode: snapshot.layoutMode,
    };
    if (!sameShellState(get(), nextState)) set(nextState);
  },
}));
