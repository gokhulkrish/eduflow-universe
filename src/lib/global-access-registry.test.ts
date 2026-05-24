import { describe, expect, it } from "vitest";
import { APP_ACCESS_RULES, getAccessCoverage, resolveAccessKeyForPathname } from "@/lib/global-access-registry";

describe("global access registry", () => {
  it("keeps the landing page public", () => {
    expect(resolveAccessKeyForPathname("/")).toBeNull();
  });

  it("maps the admin backup and security routes to global access keys", () => {
    expect(resolveAccessKeyForPathname("/backups")).toBe("backups");
    expect(resolveAccessKeyForPathname("/security")).toBe("security");
  });

  it("maps nested routes to the parent access key", () => {
    expect(resolveAccessKeyForPathname("/students/new")).toBe("students");
    expect(resolveAccessKeyForPathname("/settings/institute")).toBe("collegeInfo");
  });

  it("splits shared aliases into unique access keys", () => {
    expect(resolveAccessKeyForPathname("/import")).toBe("studentImport");
    expect(resolveAccessKeyForPathname("/student-information")).toBe("studentInformation");
    expect(resolveAccessKeyForPathname("/student-search")).toBe("studentSearch");
    expect(resolveAccessKeyForPathname("/settings/headers")).toBe("settingsHeaders");
    expect(resolveAccessKeyForPathname("/administration")).toBe("administration");
    expect(resolveAccessKeyForPathname("/video-rooms")).toBe("videoRooms");
    expect(new Set(APP_ACCESS_RULES.map((rule) => rule.key)).size).toBe(APP_ACCESS_RULES.length);
  });

  it("reports coverage from the full global route registry", () => {
    const coverage = getAccessCoverage(["settingsBackup", "administration", "students", "studentImport", "studentInformation", "studentSearch"]);

    expect(coverage.totalRules).toBeGreaterThan(0);
    expect(coverage.coveredKeys).toBe(6);
    expect(coverage.missingRules).toBeGreaterThan(0);
  });
});
