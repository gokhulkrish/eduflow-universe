import { create } from "zustand";

interface ShellState {
  focus: boolean;
  fabOpen: boolean;
  theme: "light" | "dark";
  toggleFocus: () => void;
  setFabOpen: (o: boolean) => void;
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
}

const initialTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export const useShell = create<ShellState>((set, get) => ({
  focus: false,
  fabOpen: false,
  theme: initialTheme(),
  toggleFocus: () => set((s) => ({ focus: !s.focus })),
  setFabOpen: (fabOpen) => set({ fabOpen }),
  setTheme: (theme) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("nge-theme", theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
