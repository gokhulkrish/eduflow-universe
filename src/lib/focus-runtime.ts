import { getShellRuntimeSnapshot, subscribeShellRuntime } from "./shell-runtime";
import { FOCUS_MODE_ORDER, getFocusModeRuntime, type FocusMode, type FocusModeRuntime } from "./focus-mode";

export type FocusRuntimeTone = "primary" | "success" | "warning";

export interface FocusRuntimeBadge {
  key: string;
  label: string;
  value: string;
  tone: FocusRuntimeTone;
}

export interface FocusRuntimeSnapshot extends FocusModeRuntime {
  density: "full" | "balanced" | "compressed";
  noiseState: "standard" | "reduced" | "silent";
  summary: string;
  badges: FocusRuntimeBadge[];
}

const isBrowser = () => typeof window !== "undefined";

function getFocusDensity(mode: FocusMode): FocusRuntimeSnapshot["density"] {
  if (mode === "deep") return "compressed";
  if (mode === "focus") return "balanced";
  return "full";
}

function getNoiseState(mode: FocusMode): FocusRuntimeSnapshot["noiseState"] {
  if (mode === "deep") return "silent";
  if (mode === "focus") return "reduced";
  return "standard";
}

export function buildFocusRuntimeBadgeClass(tone: FocusRuntimeTone): string {
  if (tone === "success") return "bg-success/10 text-success";
  if (tone === "warning") return "bg-warning/15 text-warning";
  return "bg-primary/10 text-primary";
}

export function getFocusRuntimeSnapshot(mode: unknown = getShellRuntimeSnapshot().focusMode): FocusRuntimeSnapshot {
  const runtime = getFocusModeRuntime(mode);
  const density = getFocusDensity(runtime.mode);
  const noiseState = getNoiseState(runtime.mode);

  return {
    ...runtime,
    density,
    noiseState,
    summary: summarizeFocusRuntime(runtime.mode),
    badges: buildFocusRuntimeBadges(runtime.mode),
  };
}

export function buildFocusRuntimeBadges(mode: unknown = getShellRuntimeSnapshot().focusMode): FocusRuntimeBadge[] {
  const runtime = getFocusModeRuntime(mode);
  const density = getFocusDensity(runtime.mode);
  const noiseState = getNoiseState(runtime.mode);

  return [
    {
      key: "mode",
      label: "Mode",
      value: runtime.label,
      tone: runtime.active ? "success" : "primary",
    },
    {
      key: "noise",
      label: "Noise",
      value: noiseState,
      tone: runtime.reducedNoise ? "warning" : "primary",
    },
    {
      key: "workspace",
      label: "Workspace",
      value: density,
      tone: runtime.workspaceMinimized ? "success" : "primary",
    },
    {
      key: "context",
      label: "Context",
      value: runtime.contextCompression ? "compressed" : "open",
      tone: runtime.contextCompression ? "warning" : "primary",
    },
  ];
}

export function summarizeFocusRuntime(mode: unknown = getShellRuntimeSnapshot().focusMode): string {
  const runtime = getFocusModeRuntime(mode);
  const density = getFocusDensity(runtime.mode);
  const noiseState = getNoiseState(runtime.mode);
  return `${runtime.label} · ${noiseState} noise · ${density} workspace`;
}

export function getFocusRuntimeOptions(): FocusModeRuntime[] {
  return FOCUS_MODE_ORDER.map((mode) => getFocusModeRuntime(mode));
}

export function subscribeFocusRuntime(listener: () => void) {
  if (!isBrowser()) return () => {};
  return subscribeShellRuntime(listener);
}
