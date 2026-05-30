import { useEffect, useCallback } from "react";

type KeyCombo = string;
type Handler = (e: KeyboardEvent) => void;

function parseCombo(combo: KeyCombo): { ctrl: boolean; meta: boolean; alt: boolean; shift: boolean; key: string } {
  const parts = combo.toLowerCase().split("+");
  return {
    ctrl: parts.includes("ctrl"),
    meta: parts.includes("meta") || parts.includes("cmd"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
    key: parts.filter((p) => !["ctrl", "meta", "cmd", "alt", "shift"].includes(p)).join("+"),
  };
}

function matchEvent(e: KeyboardEvent, combo: KeyCombo): boolean {
  const { ctrl, meta, alt, shift, key } = parseCombo(combo);
  if (e.ctrlKey !== ctrl) return false;
  if (e.metaKey !== meta) return false;
  if (e.altKey !== alt) return false;
  if (e.shiftKey !== shift) return false;
  if (key === "escape") return e.key === "Escape";
  if (key === "enter") return e.key === "Enter";
  if (key === "up") return e.key === "ArrowUp";
  if (key === "down") return e.key === "ArrowDown";
  return e.key.toLowerCase() === key;
}

export function useHotkey(combos: KeyCombo | KeyCombo[], handler: Handler, enabled = true) {
  const stableHandler = useCallback(handler, [handler]);
  const comboList = Array.isArray(combos) ? combos : [combos];

  useEffect(() => {
    if (!enabled) return;
    const listener = (e: KeyboardEvent) => {
      if (comboList.some((combo) => matchEvent(e, combo))) {
        stableHandler(e);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [comboList, stableHandler, enabled]);
}
