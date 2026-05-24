import { getMobileShellSnapshot, subscribeMobileShellRuntime, type MobileShellSnapshot } from "./mobile-shell";

export type MobileRuntimeTone = "primary" | "success" | "warning";

export interface MobileRuntimeBadge {
  key: string;
  label: string;
  value: string;
  tone: MobileRuntimeTone;
}

export interface MobileRuntimeSnapshot extends MobileShellSnapshot {
  viewportBand: "compact" | "standard" | "wide";
  interactionMode: "touch" | "pointer";
  overflowState: "locked" | "free";
  summary: string;
  badges: MobileRuntimeBadge[];
}

function getViewportBand(width: number): MobileRuntimeSnapshot["viewportBand"] {
  if (width < 768) return "compact";
  if (width < 1024) return "standard";
  return "wide";
}

function getInteractionMode(snapshot: MobileShellSnapshot): MobileRuntimeSnapshot["interactionMode"] {
  return snapshot.touchCapable ? "touch" : "pointer";
}

function getOverflowState(snapshot: MobileShellSnapshot): MobileRuntimeSnapshot["overflowState"] {
  return snapshot.overflowLocked ? "locked" : "free";
}

export function buildMobileRuntimeBadgeClass(tone: MobileRuntimeTone): string {
  if (tone === "success") return "bg-success/10 text-success";
  if (tone === "warning") return "bg-warning/15 text-warning";
  return "bg-primary/10 text-primary";
}

export function summarizeMobileRuntime(snapshot: MobileShellSnapshot = getMobileShellSnapshot()): string {
  return `${getViewportBand(snapshot.viewportWidth)} viewport · ${getInteractionMode(snapshot)} input · ${getOverflowState(snapshot)} scroll`;
}

export function buildMobileRuntimeBadges(snapshot: MobileShellSnapshot = getMobileShellSnapshot()): MobileRuntimeBadge[] {
  const viewportBand = getViewportBand(snapshot.viewportWidth);
  const interactionMode = getInteractionMode(snapshot);
  const overflowState = getOverflowState(snapshot);

  return [
    {
      key: "viewport",
      label: "Viewport",
      value: `${snapshot.viewportWidth}x${snapshot.viewportHeight}`,
      tone: snapshot.isMobile ? "warning" : "primary",
    },
    {
      key: "band",
      label: "Band",
      value: viewportBand,
      tone: viewportBand === "compact" ? "warning" : "primary",
    },
    {
      key: "touch",
      label: "Input",
      value: interactionMode,
      tone: snapshot.touchCapable ? "success" : "primary",
    },
    {
      key: "overflow",
      label: "Scroll",
      value: overflowState,
      tone: snapshot.overflowLocked ? "warning" : "success",
    },
  ];
}

export function getMobileRuntimeSnapshot(input: MobileShellSnapshot = getMobileShellSnapshot()): MobileRuntimeSnapshot {
  const viewportBand = getViewportBand(input.viewportWidth);
  const interactionMode = getInteractionMode(input);
  const overflowState = getOverflowState(input);

  return {
    ...input,
    viewportBand,
    interactionMode,
    overflowState,
    summary: summarizeMobileRuntime(input),
    badges: buildMobileRuntimeBadges(input),
  };
}

export function subscribeMobileRuntime(listener: () => void) {
  return subscribeMobileShellRuntime(listener);
}
