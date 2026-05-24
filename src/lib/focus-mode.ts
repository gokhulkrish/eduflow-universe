export type FocusMode = "off" | "focus" | "deep";

export interface FocusModeProfile {
  mode: FocusMode;
  label: string;
  description: string;
  reducedNoise: boolean;
  workspaceMinimized: boolean;
  contextCompression: boolean;
}

export interface FocusModeRuntime extends FocusModeProfile {
  active: boolean;
  nextMode: FocusMode;
  actionLabel: string;
  actionDescription: string;
}

export const FOCUS_MODE_ORDER: FocusMode[] = ["off", "focus", "deep"];

export const FOCUS_MODE_PROFILES: Record<FocusMode, FocusModeProfile> = {
  off: {
    mode: "off",
    label: "Off",
    description: "Full workspace chrome, trace surfaces, and regular motion.",
    reducedNoise: false,
    workspaceMinimized: false,
    contextCompression: false,
  },
  focus: {
    mode: "focus",
    label: "Focus",
    description: "Hide the main chrome and keep the workspace calm.",
    reducedNoise: true,
    workspaceMinimized: true,
    contextCompression: false,
  },
  deep: {
    mode: "deep",
    label: "Deep Focus",
    description: "Compress context further for the lowest-noise working state.",
    reducedNoise: true,
    workspaceMinimized: true,
    contextCompression: true,
  },
};

const isFocusMode = (value: unknown): value is FocusMode =>
  value === "off" || value === "focus" || value === "deep";

export function normalizeFocusMode(value: unknown, fallback: FocusMode = "off"): FocusMode {
  if (isFocusMode(value)) return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "off" || normalized === "focus" || normalized === "deep") return normalized;
    if (normalized === "on") return "focus";
  }
  return fallback;
}

export function cycleFocusMode(current: FocusMode): FocusMode {
  const index = FOCUS_MODE_ORDER.indexOf(current);
  return FOCUS_MODE_ORDER[(index + 1) % FOCUS_MODE_ORDER.length] ?? "off";
}

export function toggleFocusMode(current: FocusMode): FocusMode {
  return current === "off" ? "focus" : "off";
}

export function getFocusModeProfile(mode: unknown): FocusModeProfile {
  return FOCUS_MODE_PROFILES[normalizeFocusMode(mode)];
}

export function getFocusModeRuntime(mode: unknown): FocusModeRuntime {
  const profile = getFocusModeProfile(mode);
  return {
    ...profile,
    active: profile.mode !== "off",
    nextMode: cycleFocusMode(profile.mode),
    actionLabel:
      profile.mode === "off" ? "Enter Focus" : profile.mode === "focus" ? "Deep Focus" : "Exit Focus",
    actionDescription:
      profile.mode === "off"
        ? "Hide the core chrome and simplify the workspace."
        : profile.mode === "focus"
          ? "Compress context further for a quieter workspace."
          : "Return to the standard workspace layout.",
  };
}

