import { describe, expect, it } from "vitest";
import {
  cycleFocusMode,
  getFocusModeProfile,
  getFocusModeRuntime,
  normalizeFocusMode,
  toggleFocusMode,
} from "./focus-mode";

describe("focus mode", () => {
  it("normalizes and cycles focus presets", () => {
    expect(normalizeFocusMode("DEEP")).toBe("deep");
    expect(normalizeFocusMode("on")).toBe("focus");
    expect(toggleFocusMode("off")).toBe("focus");
    expect(toggleFocusMode("deep")).toBe("off");
    expect(cycleFocusMode("off")).toBe("focus");
    expect(cycleFocusMode("focus")).toBe("deep");
    expect(cycleFocusMode("deep")).toBe("off");
  });

  it("describes reduced-noise runtime state", () => {
    const runtime = getFocusModeRuntime("deep");
    expect(runtime.active).toBe(true);
    expect(runtime.reducedNoise).toBe(true);
    expect(runtime.workspaceMinimized).toBe(true);
    expect(runtime.contextCompression).toBe(true);
    expect(runtime.nextMode).toBe("off");
    expect(runtime.actionLabel).toBe("Exit Focus");
    expect(getFocusModeProfile("off").reducedNoise).toBe(false);
  });
});

