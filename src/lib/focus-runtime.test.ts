import { describe, expect, it } from "vitest";
import {
  buildFocusRuntimeBadgeClass,
  buildFocusRuntimeBadges,
  getFocusRuntimeOptions,
  getFocusRuntimeSnapshot,
  summarizeFocusRuntime,
} from "./focus-runtime";

describe("focus runtime", () => {
  it("derives summaries and badges from focus modes", () => {
    const snapshot = getFocusRuntimeSnapshot("deep");
    expect(snapshot.mode).toBe("deep");
    expect(snapshot.density).toBe("compressed");
    expect(snapshot.noiseState).toBe("silent");
    expect(snapshot.summary).toContain("Deep Focus");
    expect(snapshot.badges).toHaveLength(4);
    expect(buildFocusRuntimeBadges("focus")[1].value).toBe("reduced");
    expect(buildFocusRuntimeBadgeClass("warning")).toContain("warning");
    expect(summarizeFocusRuntime("off")).toContain("Off");
  });

  it("lists the focus runtime options in cycle order", () => {
    expect(getFocusRuntimeOptions().map((option) => option.mode)).toEqual(["off", "focus", "deep"]);
  });
});
