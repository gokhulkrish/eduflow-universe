import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("import mapping registry", () => {
  it("saves and recovers a template for the same headers even when order changes", async () => {
    const registry = await import("./mapping-registry");

    const saved = registry.saveImportMappingTemplate({
      name: "Students intake",
      moduleId: "students",
      headers: ["Email Address", "First Name"],
      mapping: {
        "Email Address": "email",
        "First Name": "firstName",
      },
      conflicts: [],
      sourceProfileId: "profile-1",
      customFieldIds: ["cf-1", "cf-2"],
    });

    const match = registry.findImportMappingTemplate(
      ["First Name", "Email Address"],
      "students",
      { customFieldIds: ["cf-2", "cf-1"] },
    );

    expect(match?.template.id).toBe(saved.id);
    expect(match?.template.mapping["Email Address"]).toBe("email");
    expect(match?.matchReason).toContain("Recovered");
  });

  it("removes templates linked to a deleted profile without affecting others", async () => {
    const registry = await import("./mapping-registry");

    registry.saveImportMappingTemplate({
      name: "Profile template",
      moduleId: "students",
      headers: ["Admission No"],
      mapping: { "Admission No": "admissionNo" },
      conflicts: [],
      sourceProfileId: "profile-1",
      customFieldIds: [],
    });

    registry.saveImportMappingTemplate({
      name: "Independent template",
      moduleId: "students",
      headers: ["Phone"],
      mapping: { Phone: "phone" },
      conflicts: [],
      sourceProfileId: null,
      customFieldIds: [],
    });

    registry.deleteImportMappingTemplatesByProfile("profile-1");

    const templates = registry.loadImportMappingTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe("Independent template");
  });
});
