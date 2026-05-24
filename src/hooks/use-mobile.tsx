import * as React from "react";
import { getMobileShellSnapshot, subscribeMobileShellRuntime } from "@/lib/mobile-shell";

export function useIsMobile() {
  // Keep every consumer aligned with the bootstrapped mobile-shell runtime.
  const snapshot = React.useSyncExternalStore(
    subscribeMobileShellRuntime,
    getMobileShellSnapshot,
    getMobileShellSnapshot,
  );

  return snapshot.isMobile;
}
