import "@/lib/runtime-storage";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { studentSections, type SectionDef } from "@/lib/student-records";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import {
  deleteCustomImportField,
  deleteImportProfile,
  getImportTargetFieldOptions,
  loadCustomImportFields,
  loadImportProfiles,
  saveCustomImportField,
  saveImportProfile,
  type ImportCustomFieldDefinition,
  type ImportProfile,
  type ImportTargetBinding,
} from "@/lib/student-import";

export const registryStorageKey = "sms.header-registry.settings.v1";
export const instituteRegistryStorageKey = "sms.header-registry.institute.v1";
export const registryFieldOverridesStorageKey = "sms.header-registry.overrides.v1";
export const registrySnapshotStorageKey = "sms.header-registry.snapshot.v1";
export const registryFetchedHeadersStorageKey = "sms.header-registry.fetched-headers.v1";
export const registryFetchedHeaderMetaStorageKey = "sms.header-registry.fetched-meta.v1";
export const registryColumnSettingsStorageKey = "sms.header-registry.column-settings.v1";
export const registryFilterPresetsStorageKey = "sms.header-registry.filter-presets.v1";

export const customHeadersSectionKey = "custom-headers";

// ── STORENAMES (matching IndexedDB schema from legacy) ──────────────

export const STORENAMES = {
  headerFields: "headerFields",
  internalHeaders: "internalHeaders",
  customHeaders: "customHeaders",
  fetchedHeaders: "fetchedHeaders",
  fetchedHeaderMeta: "fetchedHeaderMeta",
  headerGroups: "headerGroups",
  headerGroupBy: "headerGroupBy",
  columnSettings: "columnSettings",
  filterSettings: "filterSettings",
} as const;

/** Header groups for the student module (used for field categorization). */
export const DEFAULT_HEADER_GROUPS = [
  "Basic Information",
  "Institute Information",
  "Course Information",
  "Academic Information",
  "Personal Information",
  "Contact Information",
  "Family Information",
  "Hostel Information",
  "Scholarship Information",
  "Banking Information",
  "Documents & Identity",
  "Other Information",
] as const;

/** Header groups for the institute module. */
export const DEFAULT_INSTITUTE_HEADER_GROUPS = [
  "General Information",
  "Contact Information",
  "Head of the Institute",
  "Nodal Officer",
  "Other Information",
] as const;

export type HeaderRegistrySectionState = {
  key: string;
  title: string;
  description: string | null;
  enabled: boolean;
  order: number;
  source: "core" | "custom";
  fields: SectionDef["fields"];
};

export type HeaderRegistrySettings = {
  version: number;
  defaultBinding: ImportTargetBinding;
  sectionOrder: string[];
  hiddenSectionKeys: string[];
  sectionLabels: Record<string, string>;
  sectionDescriptions: Record<string, string>;
  activeProfileId: string | null;
  updatedAt: string;
};

export type HeaderRegistryDiagnosticIssue = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info" | "success";
};

export type HeaderRegistryDiagnostics = {
  issues: HeaderRegistryDiagnosticIssue[];
  total: number;
  critical: number;
  warning: number;
  info: number;
  success: number;
};

const readStoredJson = <T,>(value: string | null, fallback: T): T => {
  try {
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const writeStoredJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeStoredKey = (key: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
};

const clean = (value: unknown) => String(value ?? "").trim();

const slugifySectionKey = (value: string) =>
  clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const defaultSectionKeys = () => studentSections.map((section) => slugifySectionKey(section.title));

const defaultSettings = (): HeaderRegistrySettings => ({
  version: 1,
  defaultBinding: "admissionNo",
  sectionOrder: defaultSectionKeys(),
  hiddenSectionKeys: [],
  sectionLabels: {},
  sectionDescriptions: {},
  activeProfileId: null,
  updatedAt: new Date().toISOString(),
});

export function loadHeaderRegistrySettings(): HeaderRegistrySettings {
  if (typeof window === "undefined") return defaultSettings();
  const stored = readStoredJson<Partial<HeaderRegistrySettings>>(window.localStorage.getItem(registryStorageKey), {});
  const base = defaultSettings();
  const sectionOrder = Array.isArray(stored.sectionOrder) && stored.sectionOrder.length ? stored.sectionOrder.filter(Boolean) : base.sectionOrder;
  const hiddenSectionKeys = Array.isArray(stored.hiddenSectionKeys) ? stored.hiddenSectionKeys.filter(Boolean) : base.hiddenSectionKeys;
  return {
    version: Number(stored.version ?? base.version) || base.version,
    defaultBinding: (stored.defaultBinding ?? base.defaultBinding) as ImportTargetBinding,
    sectionOrder,
    hiddenSectionKeys,
    sectionLabels: stored.sectionLabels && typeof stored.sectionLabels === "object" ? (stored.sectionLabels as Record<string, string>) : {},
    sectionDescriptions: stored.sectionDescriptions && typeof stored.sectionDescriptions === "object" ? (stored.sectionDescriptions as Record<string, string>) : {},
    activeProfileId: typeof stored.activeProfileId === "string" ? stored.activeProfileId : null,
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : base.updatedAt,
  };
}

export function saveHeaderRegistrySettings(
  settings: Partial<Omit<HeaderRegistrySettings, "version" | "updatedAt">> & { version?: number }
) {
  const current = loadHeaderRegistrySettings();
  const next: HeaderRegistrySettings = {
    version: (current.version ?? settings.version ?? 0) + 1,
    defaultBinding: (settings.defaultBinding ?? current.defaultBinding) as ImportTargetBinding,
    sectionOrder: Array.isArray(settings.sectionOrder) && settings.sectionOrder.length ? settings.sectionOrder.filter(Boolean) : current.sectionOrder,
    hiddenSectionKeys: Array.isArray(settings.hiddenSectionKeys) ? settings.hiddenSectionKeys.filter(Boolean) : current.hiddenSectionKeys,
    sectionLabels: settings.sectionLabels && typeof settings.sectionLabels === "object" ? { ...settings.sectionLabels } : { ...current.sectionLabels },
    sectionDescriptions: settings.sectionDescriptions && typeof settings.sectionDescriptions === "object" ? { ...settings.sectionDescriptions } : { ...current.sectionDescriptions },
    activeProfileId: settings.activeProfileId ?? current.activeProfileId,
    updatedAt: new Date().toISOString(),
  };
  writeStoredJson(registryStorageKey, next);
  emitAppSync(registryStorageKey);
  return next;
}

export function resetHeaderRegistrySettings() {
  const next = defaultSettings();
  writeStoredJson(registryStorageKey, next);
  emitAppSync(registryStorageKey);
  return next;
}

const sectionLookup = () =>
  studentSections.map((section, order) => ({
    key: slugifySectionKey(section.title),
    title: section.title,
    description: section.description ?? null,
    fields: section.fields,
    order,
  }));

export function buildCustomFieldSection(customFields: ImportCustomFieldDefinition[] = []): SectionDef | null {
  if (!customFields.length) return null;
  return {
    title: "Custom Headers",
    description: "Versioned custom fields that can be used across the add-student form and import pipeline.",
    fields: customFields.map((field) => ({
      name: `custom:${field.id}`,
      label: field.label || field.key,
      type:
        field.type === "number"
          ? "number"
          : field.type === "date"
            ? "date"
            : field.type === "textarea"
              ? "textarea"
              : field.type === "select"
                ? "select"
                : "text",
      options: field.options.length ? field.options : undefined,
      placeholder: field.defaultValue || undefined,
      col: field.type === "textarea" ? 3 : 1,
    })),
  };
}

export function buildRegistrySections(
  customFields: ImportCustomFieldDefinition[] = loadCustomImportFields(),
  settings: HeaderRegistrySettings = loadHeaderRegistrySettings()
): HeaderRegistrySectionState[] {
  const coreSections = sectionLookup();
  const customSection = buildCustomFieldSection(customFields);
  const customSectionState = customSection
    ? [{
        key: customHeadersSectionKey,
        title: customSection.title,
        description: customSection.description ?? null,
        enabled: !settings.hiddenSectionKeys.includes(customHeadersSectionKey),
        order: Number.MAX_SAFE_INTEGER - 1,
        source: "custom" as const,
        fields: customSection.fields,
      }]
    : [];

  const sectionMap = new Map(
    coreSections.map((section) => [
      section.key,
      {
        key: section.key,
        title: settings.sectionLabels[section.key] ?? section.title,
        description: settings.sectionDescriptions[section.key] ?? section.description,
        enabled: !settings.hiddenSectionKeys.includes(section.key),
        order: section.order,
        source: "core" as const,
        fields: section.fields,
      } satisfies HeaderRegistrySectionState,
    ])
  );

  const order = settings.sectionOrder.length ? settings.sectionOrder : coreSections.map((section) => section.key);
  const orderedCore = order
    .map((key, index) => {
      const section = sectionMap.get(key);
      if (!section) return null;
      return { ...section, order: index };
    })
    .filter(Boolean) as HeaderRegistrySectionState[];

  const remainingCore = coreSections
    .filter((section) => !order.includes(section.key))
    .map((section, index) => ({
      key: section.key,
      title: settings.sectionLabels[section.key] ?? section.title,
      description: settings.sectionDescriptions[section.key] ?? section.description,
      enabled: !settings.hiddenSectionKeys.includes(section.key),
      order: orderedCore.length + index,
      source: "core" as const,
      fields: section.fields,
    }));

  return [...orderedCore, ...remainingCore, ...customSectionState];
}

const normalize = (value: string) =>
  clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

export function buildHeaderRegistryDiagnostics(
  customFields: ImportCustomFieldDefinition[] = loadCustomImportFields(),
  profiles: ImportProfile[] = loadImportProfiles(),
  settings: HeaderRegistrySettings = loadHeaderRegistrySettings()
): HeaderRegistryDiagnostics {
  const issues: HeaderRegistryDiagnosticIssue[] = [];
  const bindings = new Set(getImportTargetFieldOptions(customFields).map((item) => item.key));
  const duplicateKeys = new Map<string, string[]>();
  const duplicateLabels = new Map<string, string[]>();

  for (const field of customFields) {
    const key = normalize(field.key);
    const label = normalize(field.label);
    duplicateKeys.set(key, [...(duplicateKeys.get(key) ?? []), field.label]);
    duplicateLabels.set(label, [...(duplicateLabels.get(label) ?? []), field.key]);
  }

  for (const [key, labels] of duplicateKeys.entries()) {
    if (key && labels.length > 1) {
      issues.push({
        id: `duplicate-key:${key}`,
        title: "Duplicate custom header key",
        detail: `${labels.join(", ")} share the same normalized key.`,
        severity: "warning",
      });
    }
  }

  for (const [label, keys] of duplicateLabels.entries()) {
    if (label && keys.length > 1) {
      issues.push({
        id: `duplicate-label:${label}`,
        title: "Duplicate custom header label",
        detail: `${keys.join(", ")} share the same normalized label.`,
        severity: "warning",
      });
    }
  }

  if (settings.defaultBinding === "ignore" || !bindings.has(settings.defaultBinding)) {
    issues.push({
      id: "default-binding",
      title: "Default key is not mapped",
      detail: `The registry default binding "${settings.defaultBinding}" does not match an available target field.`,
      severity: "critical",
    });
  } else {
    issues.push({
      id: "default-binding-ok",
      title: "Default key is valid",
      detail: `The registry default binding "${settings.defaultBinding}" is available to the importer.`,
      severity: "success",
    });
  }

  if (settings.activeProfileId) {
    const profile = profiles.find((item) => item.id === settings.activeProfileId);
    if (!profile) {
      issues.push({
        id: "active-profile-missing",
        title: "Active preset is missing",
        detail: "The saved active profile could not be found in the preset registry.",
        severity: "warning",
      });
    } else {
      issues.push({
        id: `active-profile:${profile.id}`,
        title: "Active preset loaded",
        detail: `${profile.name} v${profile.version} is driving the import workflow.`,
        severity: "info",
      });
    }
  } else {
    issues.push({
      id: "no-active-profile",
      title: "No active preset selected",
      detail: "The import workflow will use live auto-mapping until a preset is activated.",
      severity: "info",
    });
  }

  if (!customFields.length) {
    issues.push({
      id: "no-custom-fields",
      title: "No custom headers yet",
      detail: "Add custom headers to extend the registry across forms and import mapping.",
      severity: "info",
    });
  } else {
    issues.push({
      id: "custom-fields-ok",
      title: "Custom headers ready",
      detail: `${customFields.length} custom header${customFields.length === 1 ? "" : "s"} are available to the registry.`,
      severity: "success",
    });
  }

  const critical = issues.filter((issue) => issue.severity === "critical").length;
  const warning = issues.filter((issue) => issue.severity === "warning").length;
  const info = issues.filter((issue) => issue.severity === "info").length;
  const success = issues.filter((issue) => issue.severity === "success").length;

  return { issues, total: issues.length, critical, warning, info, success };
}

export function loadHeaderRegistryMeta(meta: Json | null): Record<string, string> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  const result: Record<string, string> = {};
  const importSection = meta.import;
  if (importSection && typeof importSection === "object" && !Array.isArray(importSection)) {
    const customValues = (importSection as Record<string, unknown>).customValues;
    if (customValues && typeof customValues === "object" && !Array.isArray(customValues)) {
      for (const [key, value] of Object.entries(customValues as Record<string, unknown>)) {
        result[key] = clean(value);
      }
    }
  }
  const customHeaders = meta.customHeaders;
  if (customHeaders && typeof customHeaders === "object" && !Array.isArray(customHeaders)) {
    for (const [key, value] of Object.entries(customHeaders as Record<string, unknown>)) {
      if (!result[key]) result[key] = clean(value);
    }
  }
  return result;
}

export function collectCustomHeaderValues(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values).filter(([key, value]) => key.startsWith("custom:") && clean(value))
  ) as Record<string, string>;
}

export {
  deleteCustomImportField,
  deleteImportProfile,
  loadCustomImportFields,
  loadImportProfiles,
  saveCustomImportField,
  saveImportProfile,
};

// ═════════════════════════════════════════════════════════════════════════
// HEADER REGISTRY V1 — Normalized Header Model & Registry-First APIs
// ═════════════════════════════════════════════════════════════════════════

// ── 4. Normalized Header Model ───────────────────────────────────────

export type HeaderFieldSource = "base" | "legacy-internal" | "import" | "fetched" | "custom";
export type HeaderFieldStatus = "active" | "archived" | "deleted";
export type HeaderFieldType = "text" | "number" | "date" | "textarea" | "select";

/** Canonical normalized field — the single source of truth for every header. */
export type HeaderRegistryField = {
  id: string;
  module: string;
  key: string;
  label: string;
  type: HeaderFieldType;
  defaultValue: string;
  options: string[];
  group: string;
  order: number;
  aliases: string[];
  mandatory: boolean;
  status: HeaderFieldStatus;
  source: HeaderFieldSource;
  sourceRef: string;
  createdAt: string;
  updatedAt: string;
};

export type HeaderRegistryFieldCache = {
  byId: Map<string, HeaderRegistryField>;
  byKey: Map<string, HeaderRegistryField>;
  byLabel: Map<string, HeaderRegistryField>;
  byModule: Map<string, HeaderRegistryField[]>;
};

const REGISTRY_CACHE_TTL = 30_000;
let _registryCache: { timestamp: number; cache: HeaderRegistryFieldCache } | null = null;

// ── 5. Source Precedence ────────────────────────────────────────────

const sourceRank: Record<HeaderFieldSource, number> = {
  base: 1,
  "legacy-internal": 2,
  import: 3,
  fetched: 4,
  custom: 5,
};

function compareSource(a: HeaderFieldSource, b: HeaderFieldSource): number {
  return (sourceRank[a] ?? 99) - (sourceRank[b] ?? 99);
}

// ── 6. Normalization & Resolution Helpers ───────────────────────────

/** Normalize module aliases to canonical value. */
export function normalizeHeaderFieldModule(module: string): string {
  const m = module.toLowerCase().trim();
  if (["unified", "main", "registry", "canonical"].includes(m)) return "registry";
  return m;
}

/** Build a stable machine key from a label or key string. */
export function normalizeHeaderKey(labelOrKey: string): string {
  const cleaned = clean(labelOrKey)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "unnamed_field";
}

/** Normalize and deduplicate an alias list. */
export function normalizeAliasList(list: string | string[]): string[] {
  const items = Array.isArray(list) ? list : [list];
  const seen = new Set<string>();
  return items
    .map((item) => clean(item).toLowerCase())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

/** Produce a fully normalized HeaderRegistryField from partial input. */
export function normalizeHeaderField(
  input: Partial<HeaderRegistryField> & { key?: string; label?: string }
): HeaderRegistryField {
  const now = new Date().toISOString();
  const key = normalizeHeaderKey(input.key ?? input.label ?? "");
  const label = clean(input.label) || key;
  return {
    id: input.id || `registry:${key}:${crypto.randomUUID().slice(0, 8)}`,
    module: normalizeHeaderFieldModule(input.module ?? "registry"),
    key,
    label,
    type: (input.type ?? "text") as HeaderFieldType,
    defaultValue: clean(input.defaultValue),
    options: Array.isArray(input.options) ? input.options.filter(Boolean) : [],
    group: clean(input.group) || "General",
    order: typeof input.order === "number" ? input.order : 999,
    aliases: normalizeAliasList(input.aliases ?? []),
    mandatory: !!input.mandatory,
    status: (input.status ?? "active") as HeaderFieldStatus,
    source: (input.source ?? "custom") as HeaderFieldSource,
    sourceRef: clean(input.sourceRef) || "",
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

// ── Core‑source builder (from studentSections) ──────────────────────

function buildCoreStudentFields(): HeaderRegistryField[] {
  const fields: HeaderRegistryField[] = [];
  for (const section of studentSections) {
    const group = section.title;
    for (const f of section.fields) {
      fields.push(normalizeHeaderField({
        id: `student:${f.name}`,
        module: "student",
        key: f.name,
        label: f.label,
        type: f.type === "email" || f.type === "tel" ? "text" : (f.type ?? "text") as HeaderFieldType,
        defaultValue: f.placeholder ?? "",
        options: f.options ?? [],
        group,
        order: fields.length,
        aliases: [f.label, f.name],
        mandatory: !!f.required,
        source: "base",
        sourceRef: "student-default",
      }));
    }
  }
  return fields;
}

// ── Custom‑field → registry builder ─────────────────────────────────

function buildRegistryFieldsFromCustom(): HeaderRegistryField[] {
  return loadCustomImportFields().map((cf, idx) => normalizeHeaderField({
    id: `custom:${cf.id}`,
    module: "student",
    key: cf.key,
    label: cf.label,
    type: cf.type,
    defaultValue: cf.defaultValue,
    options: cf.options,
    group: "Custom Headers",
    order: 1000 + idx,
    aliases: [cf.key, cf.label, ...cf.aliases],
    source: "custom",
    sourceRef: `custom-field:${cf.id}`,
    createdAt: cf.createdAt,
    updatedAt: cf.updatedAt,
  }));
}

// ── Institute headers builder ───────────────────────────────────────

function makeInstituteField(
  key: string,
  label: string,
  order: number,
  group: string,
  aliases: string[] = [],
  mandatory = false,
  type: HeaderFieldType = "text",
  options: string[] = [],
): HeaderRegistryField {
  const now = new Date().toISOString();
  const k = normalizeHeaderKey(key);
  return {
    id: `institute:${k}`,
    module: "institute",
    key: k,
    label,
    type,
    defaultValue: "",
    options,
    group,
    order,
    aliases: [label.toLowerCase(), ...aliases],
    mandatory,
    status: "active",
    source: "base",
    sourceRef: "institute-default",
    createdAt: now,
    updatedAt: now,
  };
}

export function buildInstituteDefaultHeaders(): HeaderRegistryField[] {
  const now = new Date().toISOString();
  return [
    // General Information (1-12)
    makeInstituteField("institute_name", "Institute Name", 1, "General Information", ["institution name", "college name", "school name"], true),
    makeInstituteField("institute_nickname", "Nickname / Short Code", 2, "General Information", ["short name", "abbreviation"]),
    makeInstituteField("institute_code", "Institute Code", 3, "General Information", ["code", "institution code"]),
    makeInstituteField("institute_category", "Institution Category", 4, "General Information", ["category", "institution category", "type of institution"]),
    makeInstituteField("institute_type", "Institute Type", 5, "General Information", ["type", "institution type"]),
    makeInstituteField("co_education", "Is Co-Education Institute", 6, "General Information", ["co education", "coeducation", "mixed"], false, "select", ["Yes", "No"]),
    makeInstituteField("established_year", "Established Year", 7, "General Information", ["estd", "established", "founded"]),
    makeInstituteField("affiliation", "Affiliation", 8, "General Information", ["affiliated to", "university"]),
    makeInstituteField("motto", "Motto", 9, "General Information", ["tagline", "slogan"]),
    makeInstituteField("aishe_code", "AISHE Code", 10, "General Information", ["aishe", "aishe id", "aishe number"]),
    // Contact Information (11-22)
    makeInstituteField("institute_email", "Email", 11, "Contact Information", ["office email", "official email"]),
    makeInstituteField("institute_phone", "Phone", 12, "Contact Information", ["office phone", "telephone", "contact number"]),
    makeInstituteField("institute_address", "Address", 13, "Contact Information", ["office address", "postal address"], false, "textarea"),
    makeInstituteField("state", "State", 14, "Contact Information", ["province", "region"]),
    makeInstituteField("district", "District", 15, "Contact Information"),
    makeInstituteField("taluk", "Taluk", 16, "Contact Information", ["taluka", "tehsil"]),
    makeInstituteField("locality", "Village / Town / Locality", 17, "Contact Information", ["village", "town", "city", "locality"]),
    makeInstituteField("ward", "Ward", 18, "Contact Information"),
    makeInstituteField("postal_code", "Postal Code", 19, "Contact Information", ["pincode", "zip code", "postcode"]),
    makeInstituteField("latitude", "Latitude", 20, "Contact Information", ["lat", "gps lat"]),
    makeInstituteField("longitude", "Longitude", 21, "Contact Information", ["lng", "long", "gps lng"]),
    makeInstituteField("website", "Website", 22, "Contact Information", ["web", "url", "site"]),
    // Head of the Institute (23-29)
    makeInstituteField("principal_name", "Principal Name", 23, "Head of the Institute", ["head name", "director name", "hoi name"]),
    makeInstituteField("principal_salutation", "Principal Salutation", 24, "Head of the Institute", ["head salutation", "hoi salutation"], false, "select", ["Dr.", "Prof.", "Mr.", "Mrs.", "Ms."]),
    makeInstituteField("principal_role", "Principal Role", 25, "Head of the Institute", ["head title", "designation", "hoi designation"]),
    makeInstituteField("principal_gender", "Principal Gender", 26, "Head of the Institute", ["head gender", "hoi gender"], false, "select", ["Male", "Female", "Other"]),
    makeInstituteField("principal_email", "Principal Email", 27, "Head of the Institute", ["head email", "director email", "hoi email"]),
    makeInstituteField("principal_phone", "Principal Phone", 28, "Head of the Institute", ["head phone", "director phone", "hoi phone"]),
    makeInstituteField("principal_aadhaar", "Principal Aadhaar Number", 29, "Head of the Institute", ["head aadhaar", "hoi aadhaar", "principal aadhar"]),
    makeInstituteField("principal_pan", "Principal PAN Number", 30, "Head of the Institute", ["head pan", "hoi pan", "principal pan"]),
    // Nodal Officer (31-36)
    makeInstituteField("nodal_officer_name", "Nodal Officer Name", 31, "Nodal Officer", ["nodal name", "nodal officer", "ero name"]),
    makeInstituteField("nodal_officer_salutation", "Nodal Officer Salutation", 32, "Nodal Officer", ["nodal salutation"], false, "select", ["Dr.", "Prof.", "Mr.", "Mrs.", "Ms."]),
    makeInstituteField("nodal_officer_role", "Nodal Officer Role", 33, "Nodal Officer", ["nodal title", "nodal designation"]),
    makeInstituteField("nodal_officer_gender", "Nodal Officer Gender", 34, "Nodal Officer", ["nodal gender"], false, "select", ["Male", "Female", "Other"]),
    makeInstituteField("nodal_officer_designation", "Nodal Officer Designation", 35, "Nodal Officer", ["nodal designation", "ero designation"]),
    makeInstituteField("nodal_officer_email", "Nodal Officer Email", 36, "Nodal Officer", ["nodal email", "ero email"]),
    makeInstituteField("nodal_officer_phone", "Nodal Officer Phone", 37, "Nodal Officer", ["nodal phone", "ero phone"]),
  ].map((f) => ({ ...f, createdAt: now, updatedAt: now }));
}

// ── 10. Cache ───────────────────────────────────────────────────────

function buildRegistryFieldCache(): HeaderRegistryFieldCache {
  const core = buildCoreStudentFields();
  const custom = buildRegistryFieldsFromCustom();
  const institute = buildInstituteDefaultHeaders();
  const fetched = buildFetchedRegistryFields();
  let all: HeaderRegistryField[] = [...core, ...custom, ...institute, ...fetched];

  // Apply persisted field overrides (for base/institute field modifications)
  const overrides = loadFieldOverrides();
  const overrideKeys = Object.keys(overrides);
  if (overrideKeys.length > 0) {
    const appliedIds = new Set<string>();
    all = all.map((field) => {
      const override = overrides[field.id];
      if (override) {
        appliedIds.add(field.id);
        return { ...field, ...override, updatedAt: override.updatedAt || field.updatedAt };
      }
      return field;
    });
    for (const [id, override] of Object.entries(overrides)) {
      if (!appliedIds.has(id)) {
        all.push(normalizeHeaderField({ ...override, id } as Parameters<typeof normalizeHeaderField>[0]));
      }
    }
  }

  const byId = new Map<string, HeaderRegistryField>();
  const byKey = new Map<string, HeaderRegistryField>();
  const byLabel = new Map<string, HeaderRegistryField>();
  const byModule = new Map<string, HeaderRegistryField[]>();

  for (const field of all) {
    const existing = byId.get(field.id);
    if (existing && compareSource(existing.source, field.source) <= 0) continue;
    byId.set(field.id, field);
    const prevForKey = byKey.get(field.key);
    if (!prevForKey || compareSource(prevForKey.source, field.source) > 0) byKey.set(field.key, field);
    const prevForLabel = byLabel.get(field.label);
    if (!prevForLabel || compareSource(prevForLabel.source, field.source) > 0) byLabel.set(field.label, field);
    const mod = byModule.get(field.module) ?? [];
    mod.push(field);
    byModule.set(field.module, mod);
  }

  return { byId, byKey, byLabel, byModule };
}

function getCachedRegistry(): HeaderRegistryFieldCache {
  if (_registryCache && Date.now() - _registryCache.timestamp < REGISTRY_CACHE_TTL) {
    return _registryCache.cache;
  }
  const cache = buildRegistryFieldCache();
  _registryCache = { timestamp: Date.now(), cache };
  return cache;
}

/** Invalidate the registry cache (call after any registry write). */
export function invalidateRegistryCache(): void {
  _registryCache = null;
}

// ── Lookup helpers ──────────────────────────────────────────────────

export function getHeaderFields(
  module?: string,
  options?: { status?: HeaderFieldStatus[]; source?: HeaderFieldSource[] }
): HeaderRegistryField[] {
  const cache = getCachedRegistry();
  let fields = module
    ? (cache.byModule.get(normalizeHeaderFieldModule(module)) ?? [])
    : [...cache.byId.values()];
  if (options?.status) fields = fields.filter((f) => options.status!.includes(f.status));
  if (options?.source) fields = fields.filter((f) => options.source!.includes(f.source));
  return fields.sort((a, b) => a.order - b.order);
}

export function getHeaderFieldById(id: string): HeaderRegistryField | null {
  return getCachedRegistry().byId.get(id) ?? null;
}

export function getHeaderFieldByKey(key: string, module?: string): HeaderRegistryField | null {
  const cache = getCachedRegistry();
  const field = cache.byKey.get(normalizeHeaderKey(key));
  if (!field) return null;
  if (module && normalizeHeaderFieldModule(field.module) !== normalizeHeaderFieldModule(module)) return null;
  return field;
}

export function getHeaderFieldByLabel(label: string, module?: string): HeaderRegistryField | null {
  const cache = getCachedRegistry();
  const normalized = normalizeHeaderKey(label);
  for (const field of cache.byLabel.values()) {
    if (normalizeHeaderKey(field.label) === normalized) {
      if (!module || normalizeHeaderFieldModule(field.module) === normalizeHeaderFieldModule(module)) return field;
    }
  }
  return null;
}

export function getHeaderFieldReferenceKey(fieldOrKey: HeaderRegistryField | string): string {
  if (typeof fieldOrKey === "string") {
    const field = getHeaderFieldByKey(fieldOrKey) ?? getHeaderFieldById(fieldOrKey);
    return field?.key ?? normalizeHeaderKey(fieldOrKey);
  }
  return fieldOrKey.key;
}

export function getHeaderFieldDisplayLabel(fieldOrKey: HeaderRegistryField | string, module?: string): string {
  if (typeof fieldOrKey === "string") {
    const field = getHeaderFieldByKey(fieldOrKey, module) ?? getHeaderFieldByLabel(fieldOrKey, module);
    return field?.label ?? fieldOrKey;
  }
  return fieldOrKey.label;
}

export function getHeaderFieldMeta(fieldOrKey: HeaderRegistryField | string, module?: string): Partial<HeaderRegistryField> | null {
  if (typeof fieldOrKey === "string") {
    return getHeaderFieldByKey(fieldOrKey, module) ?? getHeaderFieldByLabel(fieldOrKey, module);
  }
  return fieldOrKey;
}

// ── Utility Functions ───────────────────────────────────────────────

/** Convert a label to normalized grouping format (underscore-separated). */
export function normalizeHeaderGroupingText(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "_");
}

/** Clean and validate a field display label. */
export function sanitizeHeaderLabel(value: string, maxLength = 80): string {
  let label = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s\-.]/g, "");
  if (label.length > maxLength) {
    label = label.substring(0, maxLength).trim();
  }
  return label;
}

/** Generate a unique field identifier from module and key. */
export function makeHeaderFieldId(module: string, key: string): string {
  const safeModule = normalizeHeaderFieldModule(module);
  return `${safeModule}:${normalizeHeaderKey(key)}`;
}

/** Get all default/built-in student fields as normalized HeaderRegistryField[]. */
export function getDefaultInternalHeaders(): HeaderRegistryField[] {
  return buildCoreStudentFields();
}

/** Get all default institute fields (alias for buildInstituteDefaultHeaders). */
export function getDefaultInstituteHeaders(): HeaderRegistryField[] {
  return buildInstituteDefaultHeaders();
}

/** Bootstrap the full header registry (initialize stores + load defaults). */
export async function initHeaderRegistry(): Promise<HeaderRegistryField[]> {
  initRegistryStorage();
  const fields = await loadHeaderFieldsFromDB();
  if (fields.length === 0) {
    const defaults = getMainRegistryDefaultHeaders();
    await saveHeaderFieldsToDB(defaults, { clearExisting: true });
    invalidateRegistryCache();
    return defaults;
  }
  return fields;
}

// ── Grouping & Organization Functions ───────────────────────────────

/** Auto-assign a field to the best-matching group based on key keywords. */
export function inferAutomaticHeaderGroup(header: string): string {
  const normalized = normalizeHeaderKey(header).toLowerCase();
  const patterns: Record<string, string[]> = {
    "Basic Information": ["key", "id", "name", "first", "last", "enrollment", "roll", "reg", "admission"],
    "Contact Information": ["email", "phone", "mobile", "fax", "address", "city", "state", "zip", "alternate"],
    "Personal Information": ["dob", "birth", "gender", "sex", "religion", "caste", "blood", "nationality"],
    "Family Information": ["father", "mother", "parent", "guardian", "sibling", "family"],
    "Academic Information": ["grade", "gpa", "score", "mark", "result", "percentage", "stream", "section", "house"],
    "Documents & Identity": ["aadhar", "aadhaar", "pan", "cert", "document", "license", "umis", "emis"],
  };
  for (const [group, keywords] of Object.entries(patterns)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return group;
    }
  }
  return "Other Information";
}

/** Get fields organized by their group property. */
export function getGroupedHeaderFields(
  module?: string,
  options?: { status?: HeaderFieldStatus[]; source?: HeaderFieldSource[] }
): Record<string, HeaderRegistryField[]> {
  const fields = getHeaderFields(module, options);
  const grouped: Record<string, HeaderRegistryField[]> = {};
  for (const field of fields) {
    const group = field.group || "Ungrouped";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(field);
  }
  return grouped;
}

/** Organize headers into grouped sections (ordered array format). */
export function getGroupedHeaderSections(
  headers: HeaderRegistryField[],
  predicate?: (field: HeaderRegistryField) => boolean
): { group: string; fields: HeaderRegistryField[] }[] {
  const grouped: Record<string, HeaderRegistryField[]> = {};
  for (const header of headers) {
    if (predicate && !predicate(header)) continue;
    const group = header.group || "Ungrouped";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(header);
  }
  return Object.entries(grouped)
    .map(([group, fields]) => ({
      group,
      fields: fields.sort((a, b) => (a.order || 999) - (b.order || 999)),
    }))
    .sort((a, b) => {
      const aMin = a.fields[0]?.order ?? 999;
      const bMin = b.fields[0]?.order ?? 999;
      return aMin - bMin;
    });
}

// ── Field Resolution Functions ──────────────────────────────────────

/** Find all possible field matches for a header name (key, label, aliases). */
export function getResolvedHeaderLookupCandidates(
  header: string,
  module = "student"
): HeaderRegistryField[] {
  const normalized = normalizeHeaderKey(header);
  const safeModule = normalizeHeaderFieldModule(module);
  return getHeaderFields(safeModule).filter((field) => {
    if (normalizeHeaderKey(field.key) === normalized) return true;
    if (normalizeHeaderKey(field.label) === normalized) return true;
    if (field.label?.toLowerCase() === header?.toLowerCase()) return true;
    if (
      field.aliases?.some(
        (alias) =>
          normalizeHeaderKey(alias) === normalized ||
          alias?.toLowerCase() === header?.toLowerCase()
      )
    )
      return true;
    return false;
  });
}

/** Match an import column header to the best target field. */
export function resolveImportTargetHeaderField(
  inputHeaderName: string,
  module = "student"
): HeaderRegistryField | null {
  if (!inputHeaderName) return null;
  const candidates = getResolvedHeaderLookupCandidates(inputHeaderName, module);
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    return candidates.sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === "active") return -1;
        if (b.status === "active") return 1;
      }
      if (a.source !== b.source) {
        if (a.source === "custom") return -1;
        if (b.source === "custom") return 1;
      }
      return 0;
    })[0];
  }
  return null;
}

/** Resolve a legacy-style header reference to a HeaderRegistryField. */
export function resolveLegacyHeaderReference(
  ref: string,
  module = "student"
): HeaderRegistryField | null {
  if (!ref) return null;
  const normalized = normalizeHeaderKey(ref);
  const safeModule = normalizeHeaderFieldModule(module);
  let field = getHeaderFieldByKey(ref, safeModule);
  if (field) return field;
  field = getHeaderFields(safeModule).find((f) => normalizeHeaderKey(f.key) === normalized) ?? null;
  if (field) return field;
  field =
    getHeaderFields(safeModule).find((f) => f.aliases?.includes(ref)) ?? null;
  if (field) return field;
  return getHeaderFieldByLabel(ref, safeModule);
}

// ── Tab UI Utilities ────────────────────────────────────────────────

/** Build tab layout configuration from grouped header sections. */
export function buildHeaderTabsLayout(
  sections: { group: string; fields: HeaderRegistryField[] }[],
  options: { preferredKey?: string } = {}
): { tabs: { key: string; label: string; count: number }[]; activeTab: string } {
  const tabs = sections.map((s) => ({
    key: normalizeHeaderKey(s.group),
    label: s.group,
    count: s.fields.length,
  }));
  const preferredKey = options.preferredKey ? normalizeHeaderKey(options.preferredKey) : null;
  const activeTab =
    preferredKey && tabs.some((t) => t.key === preferredKey)
      ? preferredKey
      : tabs[0]?.key ?? "";
  return { tabs, activeTab };
}

/** Attach click-based tab switching behavior to a container element. */
export function bindHeaderTabs(container: HTMLElement): () => void {
  const handleClick = (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest("[data-tab-key]");
    if (!target) return;
    const tabKey = target.getAttribute("data-tab-key");
    if (!tabKey) return;

    container.querySelectorAll("[data-tab-key]").forEach((el) => el.classList.remove("active"));
    target.classList.add("active");
    container.querySelectorAll("[data-tab-panel]").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-tab-panel") === tabKey);
    });
  };
  container.addEventListener("click", handleClick);
  return () => container.removeEventListener("click", handleClick);
}

// ── 7. Field Overrides (persist modifications to base fields) ───────

const fieldOverridesStorageKey = registryFieldOverridesStorageKey;

function loadFieldOverrides(): Record<string, Partial<HeaderRegistryField>> {
  return readStoredJson<Record<string, Partial<HeaderRegistryField>>>(
    typeof window !== "undefined" ? window.localStorage.getItem(fieldOverridesStorageKey) : null,
    {}
  );
}

function saveFieldOverrides(overrides: Record<string, Partial<HeaderRegistryField>>): void {
  writeStoredJson(fieldOverridesStorageKey, overrides);
  emitAppSync(fieldOverridesStorageKey);
}

// ── 8. Core Mutation Functions ──────────────────────────────────────

/** Create or update any header field. */
export async function upsertHeaderField(
  field: Partial<HeaderRegistryField> & { key?: string; label?: string }
): Promise<HeaderRegistryField> {
  const normalized = normalizeHeaderField(field);

  const isCustom = normalized.source === "custom" || normalized.id.startsWith("custom:");

  if (isCustom) {
    const customId = normalized.id.startsWith("custom:") ? normalized.id.slice("custom:".length) : (normalized.id || crypto.randomUUID());
    const saved = saveCustomImportField({
      id: customId,
      key: normalized.key,
      label: normalized.label,
      type: normalized.type === "textarea" ? "textarea" : normalized.type === "number" ? "number" : normalized.type === "date" ? "date" : normalized.type === "select" ? "select" : "text",
      options: normalized.options,
      defaultValue: normalized.defaultValue,
      notes: "",
      aliases: normalized.aliases,
    });
    invalidateRegistryCache();
    return normalizeHeaderField({
      ...normalized,
      id: `custom:${saved.id}`,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  }

  const overrides = loadFieldOverrides();
  overrides[normalized.id] = normalized;
  saveFieldOverrides(overrides);
  invalidateRegistryCache();
  return normalized;
}

/** Delete a header field (soft or hard). */
export async function deleteHeaderField(id: string, mode: "soft" | "hard" = "soft"): Promise<boolean> {
  const cache = getCachedRegistry();
  const field = cache.byId.get(id);
  if (!field) return false;

  if (field.source === "custom") {
    const customId = id.startsWith("custom:") ? id.slice("custom:".length) : id;
    deleteCustomImportField(customId);
    invalidateRegistryCache();
    return true;
  }

  if (mode === "soft") {
    const overrides = loadFieldOverrides();
    overrides[id] = { ...field, status: "deleted", updatedAt: new Date().toISOString() };
    saveFieldOverrides(overrides);
    invalidateRegistryCache();
    return true;
  }

  if (mode === "hard") {
    const overrides = loadFieldOverrides();
    delete overrides[id];
    saveFieldOverrides(overrides);
    invalidateRegistryCache();
    return true;
  }

  return false;
}

/** Archive a header field (mark as archived, preserve data). */
export async function archiveHeaderField(id: string): Promise<boolean> {
  const cache = getCachedRegistry();
  const field = cache.byId.get(id);
  if (!field) return false;

  const overrides = loadFieldOverrides();
  overrides[id] = { ...field, status: "archived", updatedAt: new Date().toISOString() };
  saveFieldOverrides(overrides);
  invalidateRegistryCache();
  return true;
}

/** Move a header field to a different group and/or order. */
export async function moveHeaderField(id: string, newGroup: string, newOrder: number): Promise<boolean> {
  const cache = getCachedRegistry();
  const field = cache.byId.get(id);
  if (!field) return false;

  const overrides = loadFieldOverrides();
  overrides[id] = { ...field, group: newGroup, order: newOrder, updatedAt: new Date().toISOString() };
  saveFieldOverrides(overrides);
  invalidateRegistryCache();
  return true;
}

/** Add alias mappings for a field. */
export async function mergeHeaderFieldAliases(id: string, aliases: string[]): Promise<boolean> {
  const cache = getCachedRegistry();
  const field = cache.byId.get(id);
  if (!field) return false;

  const merged = normalizeAliasList([...(field.aliases || []), ...aliases]);
  const overrides = loadFieldOverrides();
  overrides[id] = { ...field, aliases: merged, updatedAt: new Date().toISOString() };
  saveFieldOverrides(overrides);
  invalidateRegistryCache();
  return true;
}

// ── Bulk Persistence (snapshot save/restore) ─────────────────────────

/** Save the full computed registry as a single snapshot to localStorage. */
export async function saveHeaderFieldsToDB(
  list?: HeaderRegistryField[],
  options: { clearExisting?: boolean } = {}
): Promise<void> {
  const fields = list ?? getMainRegistryDefaultHeaders();
  if (options.clearExisting) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(fieldOverridesStorageKey);
      window.localStorage.removeItem("sms.import.custom-fields.v1");
    }
  }
  writeStoredJson(registrySnapshotStorageKey, fields);
  emitAppSync(registrySnapshotStorageKey);
  invalidateRegistryCache();
}

/** Restore a previously saved registry snapshot from localStorage. */
export async function loadHeaderFieldsFromDB(): Promise<HeaderRegistryField[]> {
  const fields = readStoredJson<HeaderRegistryField[]>(
    typeof window !== "undefined" ? window.localStorage.getItem(registrySnapshotStorageKey) : null,
    []
  );
  if (fields.length === 0) return [];

  const customFields = fields.filter((f) => f.source === "custom");
  for (const f of customFields) {
    const customId = f.id.startsWith("custom:") ? f.id.slice("custom:".length) : f.id;
    const existingCustom = loadCustomImportFields().find((ef) => ef.id === customId);
    saveCustomImportField({
      id: customId,
      key: f.key,
      label: f.label,
      type:
        f.type === "textarea"
          ? "textarea"
          : f.type === "number"
            ? "number"
            : f.type === "date"
              ? "date"
              : f.type === "select"
                ? "select"
                : "text",
      options: f.options,
      defaultValue: f.defaultValue,
      notes: existingCustom?.notes ?? "",
      aliases: f.aliases,
    });
  }

  const overrideFields = fields.filter((f) => f.source !== "custom");
  if (overrideFields.length > 0) {
    const overrides = loadFieldOverrides();
    for (const f of overrideFields) {
      overrides[f.id] = f;
    }
    saveFieldOverrides(overrides);
  }

  invalidateRegistryCache();
  return fields;
}

/** Clear the registry snapshot from localStorage. */
export function clearRegistrySnapshot(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(registrySnapshotStorageKey);
  emitAppSync(registrySnapshotStorageKey);
}

// ── 9. Default Registry Construction ────────────────────────────────

/** Normalize, deduplicate by key, and merge aliases across duplicates. */
export function mergeUniqueRegistryDefaultFields(fields: Partial<HeaderRegistryField>[]): HeaderRegistryField[] {
  const map = new Map<string, HeaderRegistryField>();
  for (const input of fields) {
    const normalized = normalizeHeaderField(input as Parameters<typeof normalizeHeaderField>[0]);
    const existing = map.get(normalized.key);
    if (existing) {
      if (compareSource(existing.source, normalized.source) > 0) {
        normalized.aliases = normalizeAliasList([...existing.aliases, ...normalized.aliases]);
        map.set(normalized.key, normalized);
      } else {
        existing.aliases = normalizeAliasList([...existing.aliases, ...normalized.aliases]);
      }
    } else {
      map.set(normalized.key, normalized);
    }
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
}

/** Build the combined default registry (student + institute). */
export function getMainRegistryDefaultHeaders(): HeaderRegistryField[] {
  const studentFields = buildCoreStudentFields();
  const customFields = buildRegistryFieldsFromCustom();
  const instituteFields = buildInstituteDefaultHeaders();
  return mergeUniqueRegistryDefaultFields([...studentFields, ...customFields, ...instituteFields]);
}

// ── 10. Registry‑First Write Path ───────────────────────────────────

/** Save a custom header from a configuration form. */
export function saveCustomHeaderFromForm(
  data: { key: string; label: string; type: HeaderFieldType; options?: string[]; defaultValue?: string; aliases?: string[] }
): HeaderRegistryField {
  const normalized = normalizeHeaderField({
    ...data,
    source: "custom",
    sourceRef: "custom-form",
  });
  const saved = saveCustomImportField({
    id: normalized.id.startsWith("custom:") ? normalized.id.slice("custom:".length) : normalized.id,
    key: normalized.key,
    label: normalized.label,
    type: normalized.type === "textarea" ? "textarea" : normalized.type === "number" ? "number" : normalized.type === "date" ? "date" : normalized.type === "select" ? "select" : "text",
    options: normalized.options,
    defaultValue: normalized.defaultValue,
    notes: "",
    aliases: normalized.aliases,
  });
  invalidateRegistryCache();
  return normalizeHeaderField({
    ...normalized,
    id: `custom:${saved.id}`,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
  });
}

// ── 11. Compatibility & Projection Layer ────────────────────────────

/** Rebuild legacy SectionDef[] from current registry state. */
export function syncLegacyHeaderStateFromRegistry(): SectionDef[] {
  const allFields = getMainRegistryDefaultHeaders();
  const groupMap = new Map<string, HeaderRegistryField[]>();
  for (const field of allFields) {
    const list = groupMap.get(field.group) ?? [];
    list.push(field);
    groupMap.set(field.group, list);
  }
  return [...groupMap.entries()]
    .sort(([, a], [, b]) => a[0].order - b[0].order)
    .map(([title, fields]) => ({
      title,
      fields: fields.map((f) => ({
        name: f.key,
        label: f.label,
        type: f.type === "select" ? "select" : f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "textarea" ? "textarea" : "text",
        options: f.options.length ? f.options : undefined,
        required: f.mandatory,
      })),
    }));
}

/** Write compatibility projections so legacy consumers can read registry state. */
export function persistHeaderRegistryCompatibilityProjections(): void {
  const sections = syncLegacyHeaderStateFromRegistry();
  writeStoredJson("sms.header-registry.compat.sections.v1", sections);
  emitAppSync("sms.header-registry.compat.sections.v1");
}

// ═════════════════════════════════════════════════════════════════════════
// STORENAMES — localStorage-backed stores matching the IndexedDB STORENAMES schema
// ═════════════════════════════════════════════════════════════════════════

// ── Fetched Headers (import-discovered columns) ─────────────────────

export type FetchedHeaderMeta = {
  label: string;
  type: HeaderFieldType;
  defaultValue: string;
  options: string[];
  source: string;
  sourceRef: string;
  aliases: string[];
  mandatory: boolean;
  notes: string;
};

export type FetchedHeader = {
  name: string;
  label: string;
  firstSeen: string;
  lastSeen: string;
  matchCount: number;
};

const fetchedHeadersStorageKey = registryFetchedHeadersStorageKey;
const fetchedHeaderMetaStorageKey = registryFetchedHeaderMetaStorageKey;

export function loadFetchedHeaders(): FetchedHeader[] {
  return readStoredJson<FetchedHeader[]>(
    typeof window !== "undefined" ? window.localStorage.getItem(fetchedHeadersStorageKey) : null,
    []
  );
}

export function saveFetchedHeaders(list: FetchedHeader[]): void {
  writeStoredJson(fetchedHeadersStorageKey, list);
  emitAppSync(fetchedHeadersStorageKey);
}

export function loadFetchedHeaderMeta(): Record<string, FetchedHeaderMeta> {
  return readStoredJson<Record<string, FetchedHeaderMeta>>(
    typeof window !== "undefined" ? window.localStorage.getItem(fetchedHeaderMetaStorageKey) : null,
    {}
  );
}

export function saveFetchedHeaderMeta(meta: Record<string, FetchedHeaderMeta>): void {
  writeStoredJson(fetchedHeaderMetaStorageKey, meta);
  emitAppSync(fetchedHeaderMetaStorageKey);
}

/** Track an import-discovered column in fetched headers store. */
export function trackFetchedHeader(
  name: string,
  label: string,
  meta?: Partial<FetchedHeaderMeta>
): void {
  const headers = loadFetchedHeaders();
  const existing = headers.find((h) => h.name === name);
  const now = new Date().toISOString();
  if (existing) {
    existing.lastSeen = now;
    existing.matchCount += 1;
  } else {
    headers.push({ name, label, firstSeen: now, lastSeen: now, matchCount: 1 });
  }
  saveFetchedHeaders(headers);

  if (meta) {
    const allMeta = loadFetchedHeaderMeta();
    const existingMeta = allMeta[name];
    allMeta[name] = { ...existingMeta, ...meta, label: meta.label || label } as FetchedHeaderMeta;
    saveFetchedHeaderMeta(allMeta);
  }
}

/** Clear all fetched headers and their metadata. */
export function clearFetchedHeaders(): void {
  writeStoredJson(fetchedHeadersStorageKey, []);
  writeStoredJson(fetchedHeaderMetaStorageKey, {});
  emitAppSync(fetchedHeadersStorageKey);
  emitAppSync(fetchedHeaderMetaStorageKey);
}

/** Build HeaderRegistryField[] from discovered fetched headers. */
export function buildFetchedRegistryFields(): HeaderRegistryField[] {
  const headers = loadFetchedHeaders();
  const meta = loadFetchedHeaderMeta();
  return headers.map((h, idx) =>
    normalizeHeaderField({
      id: `fetched:${normalizeHeaderKey(h.name)}`,
      module: "registry",
      key: normalizeHeaderKey(h.name),
      label: meta[h.name]?.label || h.label,
      type: (meta[h.name]?.type || "text") as HeaderFieldType,
      defaultValue: meta[h.name]?.defaultValue ?? "",
      options: meta[h.name]?.options ?? [],
      group: "Imported Fields",
      order: 10000 + idx,
      aliases: meta[h.name]?.aliases ?? [h.name],
      mandatory: meta[h.name]?.mandatory ?? false,
      source: "fetched",
      sourceRef: meta[h.name]?.sourceRef ?? `fetched:${h.name}`,
    })
  );
}

// ── Column Settings (per-table column display preferences) ──────────

export type ColumnSetting = {
  header: string;
  visible: boolean;
  width: number;
  frozen: boolean;
  order: number;
};

const columnSettingsStorageKey = registryColumnSettingsStorageKey;

export function loadColumnSettings(tableKey: string): Record<string, ColumnSetting> {
  const all = readStoredJson<Record<string, Record<string, ColumnSetting>>>(
    typeof window !== "undefined" ? window.localStorage.getItem(columnSettingsStorageKey) : null,
    {}
  );
  return all[tableKey] ?? {};
}

export function loadAllColumnSettings(): Record<string, Record<string, ColumnSetting>> {
  return readStoredJson<Record<string, Record<string, ColumnSetting>>>(
    typeof window !== "undefined" ? window.localStorage.getItem(columnSettingsStorageKey) : null,
    {}
  );
}

export function saveColumnSettings(
  settings: Record<string, ColumnSetting>,
  tableKey = "default"
): void {
  const all = loadAllColumnSettings();
  all[tableKey] = settings;
  writeStoredJson(columnSettingsStorageKey, all);
  emitAppSync(columnSettingsStorageKey);
}

// ── Filter Presets (saved filter configurations) ────────────────────

export type FilterOperator =
  | "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte" | "in" | "between";

export type FilterCondition = {
  field: string;
  operator: FilterOperator;
  value: string | string[];
};

export type FilterPreset = {
  id: string;
  name: string;
  conditions: FilterCondition[];
  createdAt: string;
  updatedAt: string;
};

const filterPresetsStorageKey = registryFilterPresetsStorageKey;

export function loadFilterPresets(): FilterPreset[] {
  return readStoredJson<FilterPreset[]>(
    typeof window !== "undefined" ? window.localStorage.getItem(filterPresetsStorageKey) : null,
    []
  );
}

export function saveFilterPreset(
  preset: Omit<FilterPreset, "id" | "createdAt" | "updatedAt"> & { id?: string }
): FilterPreset {
  const presets = loadFilterPresets();
  const now = new Date().toISOString();
  const id = preset.id || crypto.randomUUID();
  const existing = presets.find((p) => p.id === id);
  const next: FilterPreset = {
    id,
    name: preset.name || "Unnamed filter",
    conditions: preset.conditions.filter(Boolean),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const nextList = presets.filter((p) => p.id !== id).concat(next);
  writeStoredJson(filterPresetsStorageKey, nextList);
  emitAppSync(filterPresetsStorageKey);
  return next;
}

export function deleteFilterPreset(id: string): void {
  const next = loadFilterPresets().filter((p) => p.id !== id);
  if (next.length) writeStoredJson(filterPresetsStorageKey, next);
  else removeStoredKey(filterPresetsStorageKey);
  emitAppSync(filterPresetsStorageKey);
}

// ── Registry Initialization ─────────────────────────────────────────

const allRegistryStorageKeys = [
  registryStorageKey,
  instituteRegistryStorageKey,
  fieldOverridesStorageKey,
  registrySnapshotStorageKey,
  fetchedHeadersStorageKey,
  fetchedHeaderMetaStorageKey,
  columnSettingsStorageKey,
  filterPresetsStorageKey,
];

/** Initialize all registry stores with defaults if they don't exist. */
export function initRegistryStorage(): void {
  if (typeof window === "undefined") return;

  if (!window.localStorage.getItem(registryStorageKey)) {
    writeStoredJson(registryStorageKey, defaultSettings());
  }
  if (!window.localStorage.getItem(fetchedHeadersStorageKey)) {
    writeStoredJson(fetchedHeadersStorageKey, []);
  }
  if (!window.localStorage.getItem(fetchedHeaderMetaStorageKey)) {
    writeStoredJson(fetchedHeaderMetaStorageKey, {});
  }
  if (!window.localStorage.getItem(columnSettingsStorageKey)) {
    writeStoredJson(columnSettingsStorageKey, {});
  }
  if (!window.localStorage.getItem(filterPresetsStorageKey)) {
    writeStoredJson(filterPresetsStorageKey, []);
  }
  invalidateRegistryCache();
}

/** Get all storage keys managed by the registry (for cross-tab sync subscriptions). */
export function getRegistryStorageKeys(): string[] {
  return [...allRegistryStorageKeys];
}

// ═════════════════════════════════════════════════════════════════════════
// SUPABASE PERSISTENCE — Optional cloud sync for registry state
// ═════════════════════════════════════════════════════════════════════════

async function getDefaultInstitutionId(): Promise<string> {
  if (!(await tableExists("institutions"))) throw new Error("Missing institutions table");
  const { data, error } = await supabase.from("institutions").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("Create an institution before syncing registry");
  return data.id;
}

type RegistrySyncPayload = {
  settings: Record<string, unknown>;
  institute: Record<string, unknown>;
  instituteConfig: Record<string, string>;
  groupBy: Record<string, string[]>;
  groups: string[];
  customFields: unknown[];
  profiles: unknown[];
  fieldOverrides: Record<string, unknown>;
  fetchedHeaders: unknown[];
  fetchedHeaderMeta: Record<string, unknown>;
  columnSettings: Record<string, unknown>;
  filterPresets: unknown[];
};

/** Read all registry state from localStorage into a sync payload. */
export function readRegistrySyncPayload(): RegistrySyncPayload {
  return {
    settings: readStoredJson<Record<string, unknown>>(window.localStorage.getItem(registryStorageKey), {}),
    institute: readStoredJson<Record<string, unknown>>(instituteRegistryStorageKey, {}),
    instituteConfig: readStoredJson<Record<string, string>>(`${instituteRegistryStorageKey}.config`, {}),
    groupBy: readStoredJson<Record<string, string[]>>(`${instituteRegistryStorageKey}.groupby`, {}),
    groups: readStoredJson<string[]>(`${instituteRegistryStorageKey}.groups.institute`, []),
    customFields: readStoredJson<unknown[]>(window.localStorage.getItem("sms.import.custom-fields.v1"), []),
    profiles: readStoredJson<unknown[]>(window.localStorage.getItem("sms.import.profiles.v1"), []),
    fieldOverrides: readStoredJson<Record<string, unknown>>(window.localStorage.getItem(fieldOverridesStorageKey), {}),
    fetchedHeaders: readStoredJson<unknown[]>(window.localStorage.getItem(fetchedHeadersStorageKey), []),
    fetchedHeaderMeta: readStoredJson<Record<string, unknown>>(window.localStorage.getItem(fetchedHeaderMetaStorageKey), {}),
    columnSettings: readStoredJson<Record<string, unknown>>(window.localStorage.getItem(columnSettingsStorageKey), {}),
    filterPresets: readStoredJson<unknown[]>(window.localStorage.getItem(filterPresetsStorageKey), []),
  };
}

/** Write a sync payload into localStorage. */
export function writeRegistrySyncPayload(payload: RegistrySyncPayload): void {
  writeStoredJson(registryStorageKey, payload.settings as any);
  writeStoredJson(instituteRegistryStorageKey, payload.institute as any);
  writeStoredJson(`${instituteRegistryStorageKey}.config`, payload.instituteConfig);
  writeStoredJson(`${instituteRegistryStorageKey}.groupby`, payload.groupBy);
  writeStoredJson(`${instituteRegistryStorageKey}.groups.institute`, payload.groups);
  writeStoredJson("sms.import.custom-fields.v1", payload.customFields);
  writeStoredJson("sms.import.profiles.v1", payload.profiles);
  writeStoredJson(fieldOverridesStorageKey, payload.fieldOverrides);
  writeStoredJson(fetchedHeadersStorageKey, payload.fetchedHeaders);
  writeStoredJson(fetchedHeaderMetaStorageKey, payload.fetchedHeaderMeta);
  writeStoredJson(columnSettingsStorageKey, payload.columnSettings);
  writeStoredJson(filterPresetsStorageKey, payload.filterPresets);
  invalidateRegistryCache();
}

/** Sync the full registry state to the `institutions.meta` JSON column. */
export async function syncRegistryToSupabase(): Promise<void> {
  const institutionId = await getDefaultInstitutionId();
  const payload = readRegistrySyncPayload();
  const { data: existing } = await supabase.from("institutions").select("meta").eq("id", institutionId).maybeSingle();
  const meta = (existing?.meta as Record<string, unknown>) ?? {};
  meta.headerRegistry = payload;
  const { error } = await supabase.from("institutions").update({ meta: meta as any }).eq("id", institutionId);
  if (error) throw error;
}

/** Load the registry state from Supabase into localStorage. */
export async function loadRegistryFromSupabase(): Promise<void> {
  const institutionId = await getDefaultInstitutionId();
  const { data, error } = await supabase.from("institutions").select("meta").eq("id", institutionId).maybeSingle();
  if (error) throw error;
  const meta = data?.meta as Record<string, unknown> | null;
  const payload = meta?.headerRegistry as RegistrySyncPayload | null;
  if (!payload) throw new Error("No registry data found in Supabase");
  writeRegistrySyncPayload(payload);
}
