import { afterEach, describe, expect, it } from "vitest";
import {
  LEGACY_IMPORT_PROFILES_STORAGE_KEY,
  buildStorageNormalizationSnapshot,
  normalizeStoragePersistence,
} from "./storage-normalization";
import { importStorageKeys } from "./student-import";

describe("storage normalization", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("detects collisions between modern and legacy import profile keys", () => {
    window.localStorage.setItem(importStorageKeys.profiles, JSON.stringify([{ id: "modern" }]));
    window.localStorage.setItem(LEGACY_IMPORT_PROFILES_STORAGE_KEY, JSON.stringify([{ id: "legacy" }]));

    const snapshot = buildStorageNormalizationSnapshot();

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.summary.collisions).toBe(1);
  });

  it("repairs legacy import profile aliases into the modern key", () => {
    window.localStorage.setItem(LEGACY_IMPORT_PROFILES_STORAGE_KEY, JSON.stringify([{ id: "legacy" }]));

    const snapshot = normalizeStoragePersistence();

    expect(window.localStorage.getItem(importStorageKeys.profiles)).toBe(JSON.stringify([{ id: "legacy" }]));
    expect(window.localStorage.getItem(LEGACY_IMPORT_PROFILES_STORAGE_KEY)).toBe(JSON.stringify([{ id: "legacy" }]));
    expect(snapshot.summary.repairs).toBeGreaterThan(0);
    expect(snapshot.status).toBe("healthy");
  });
});
