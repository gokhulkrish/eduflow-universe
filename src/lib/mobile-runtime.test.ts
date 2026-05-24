import { describe, expect, it } from "vitest";
import {
  buildMobileRuntimeBadgeClass,
  buildMobileRuntimeBadges,
  getMobileRuntimeSnapshot,
  summarizeMobileRuntime,
} from "./mobile-runtime";

describe("mobile runtime", () => {
  it("derives mobile stability summaries and badges", () => {
    const snapshot = getMobileRuntimeSnapshot({
      isMobile: true,
      touchCapable: true,
      viewportWidth: 480,
      viewportHeight: 900,
      overflowLocked: true,
      overlayLocks: 2,
      updatedAt: "2026-05-23T00:00:00.000Z",
    });

    expect(snapshot.viewportBand).toBe("compact");
    expect(snapshot.interactionMode).toBe("touch");
    expect(snapshot.overflowState).toBe("locked");
    expect(snapshot.badges).toHaveLength(4);
    expect(buildMobileRuntimeBadges(snapshot)[0].value).toBe("480x900");
    expect(buildMobileRuntimeBadgeClass("warning")).toContain("warning");
    expect(summarizeMobileRuntime(snapshot)).toContain("compact viewport");
  });
});
