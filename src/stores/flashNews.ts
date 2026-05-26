import { create } from "zustand";
import { generateId } from "@/lib/utils";

export type FlashNewsSeverity = "info" | "success" | "warning" | "critical";

export interface FlashNewsItem {
  id: string;
  title: string;
  message: string;
  severity: FlashNewsSeverity;
  pinned: boolean;
  liveFrom: string;
  liveUntil?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type FlashNewsPosition = "top" | "bottom";
export type FlashNewsStyle = "compact" | "emphasized";

const STORAGE_KEY = "sms.flashNews.items";
const SETTINGS_KEY = "sms.flashNews.settings";

interface FlashNewsSettings {
  enabled: boolean;
  position: FlashNewsPosition;
  style: FlashNewsStyle;
}

interface FlashNewsState {
  items: FlashNewsItem[];
  settings: FlashNewsSettings;
  addItem: (item: Omit<FlashNewsItem, "id" | "createdAt" | "updatedAt">) => void;
  updateItem: (id: string, patch: Partial<FlashNewsItem>) => void;
  deleteItem: (id: string) => void;
  togglePin: (id: string) => void;
  getActiveItems: () => FlashNewsItem[];
  updateSettings: (patch: Partial<FlashNewsSettings>) => void;
}

function loadItems(): FlashNewsItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: FlashNewsItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota */ }
}

function loadSettings(): FlashNewsSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { enabled: false, position: "top", style: "compact" };
}

function saveSettings(settings: FlashNewsSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* quota */ }
}

function isItemActive(item: FlashNewsItem): boolean {
  const now = Date.now();
  const from = new Date(item.liveFrom).getTime();
  if (now < from) return false;
  if (item.liveUntil && now > new Date(item.liveUntil).getTime()) return false;
  return true;
}

export const useFlashNews = create<FlashNewsState>((set, get) => ({
  items: loadItems(),
  settings: loadSettings(),

  addItem: (item) => {
    const now = new Date().toISOString();
    const newItem: FlashNewsItem = {
      ...item,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    set((s) => {
      const items = [newItem, ...s.items];
      saveItems(items);
      return { items };
    });
  },

  updateItem: (id, patch) => {
    set((s) => {
      const items = s.items.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      );
      saveItems(items);
      return { items };
    });
  },

  deleteItem: (id) => {
    set((s) => {
      const items = s.items.filter((item) => item.id !== id);
      saveItems(items);
      return { items };
    });
  },

  togglePin: (id) => {
    set((s) => {
      const items = s.items.map((item) =>
        item.id === id ? { ...item, pinned: !item.pinned, updatedAt: new Date().toISOString() } : item
      );
      saveItems(items);
      return { items };
    });
  },

  getActiveItems: () => {
    return get().items.filter((item) => isItemActive(item));
  },

  updateSettings: (patch) => {
    set((s) => {
      const settings = { ...s.settings, ...patch };
      saveSettings(settings);
      return { settings };
    });
  },
}));
