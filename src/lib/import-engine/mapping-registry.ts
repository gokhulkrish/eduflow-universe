import "@/lib/runtime-storage";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import type { ImportMappingConflict, ImportTargetBinding } from "@/lib/student-import";

export const importMappingTemplateStorageKey = "sms.import.mapping-templates.v1";

type StoredTemplateInput = {
  id?: string;
  name: string;
  moduleId: string;
  headers: string[];
  mapping: Record<string, ImportTargetBinding>;
  conflicts?: ImportMappingConflict[];
  sourceProfileId?: string | null;
  customFieldIds?: string[];
  usageCount?: number;
  lastUsedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export interface ImportMappingTemplate {
  id: string;
  name: string;
  moduleId: string;
  headerSignature: string;
  headers: string[];
  mapping: Record<string, ImportTargetBinding>;
  conflicts: ImportMappingConflict[];
  sourceProfileId: string | null;
  customFieldIds: string[];
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportMappingTemplateMatch {
  template: ImportMappingTemplate;
  matchReason: string;
}

const STORAGE_KEYS = [importMappingTemplateStorageKey];

const readStoredJson = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
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

const makeId = () =>
  `mapping_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeHeader = (value: string) =>
  clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildHeaderSignature = (headers: string[]) =>
  [...new Set(headers.map(normalizeHeader).filter(Boolean))].sort().join("|");

const buildCustomFieldSignature = (customFieldIds: string[]) =>
  [...new Set(customFieldIds.map(clean).filter(Boolean))].sort().join("|");

const normalizeBinding = (value: unknown): ImportTargetBinding => {
  if (typeof value !== "string") return "ignore";
  const next = value.trim();
  return next ? (next as ImportTargetBinding) : "ignore";
};

const normalizeTemplate = (template: StoredTemplateInput): ImportMappingTemplate => {
  const now = new Date().toISOString();
  const headers = Array.isArray(template.headers) ? template.headers.map(clean).filter(Boolean) : [];
  const mapping = Object.fromEntries(
    Object.entries(template.mapping ?? {}).map(([header, target]) => [clean(header), normalizeBinding(target)]).filter(([header]) => Boolean(header)),
  ) as Record<string, ImportTargetBinding>;

  return {
    id: clean(template.id) || makeId(),
    name: clean(template.name) || "Untitled mapping template",
    moduleId: clean(template.moduleId) || "students",
    headerSignature: buildHeaderSignature(headers),
    headers,
    mapping,
    conflicts: Array.isArray(template.conflicts)
      ? template.conflicts.map((conflict) => ({
          target: normalizeBinding(conflict.target),
          keptHeader: clean(conflict.keptHeader),
          droppedHeaders: Array.isArray(conflict.droppedHeaders)
            ? conflict.droppedHeaders.map(clean).filter(Boolean)
            : [],
          score: Number(conflict.score) || 0,
          reason: clean(conflict.reason),
        }))
      : [],
    sourceProfileId: typeof template.sourceProfileId === "string" && template.sourceProfileId.trim()
      ? template.sourceProfileId.trim()
      : null,
    customFieldIds: Array.isArray(template.customFieldIds) ? template.customFieldIds.map(clean).filter(Boolean) : [],
    usageCount: Math.max(0, Number(template.usageCount ?? 0) || 0),
    lastUsedAt: typeof template.lastUsedAt === "string" && template.lastUsedAt.trim() ? template.lastUsedAt.trim() : null,
    createdAt: typeof template.createdAt === "string" && template.createdAt.trim() ? template.createdAt.trim() : now,
    updatedAt: typeof template.updatedAt === "string" && template.updatedAt.trim() ? template.updatedAt.trim() : now,
  };
};

function persistTemplates(templates: ImportMappingTemplate[]): ImportMappingTemplate[] {
  const next = templates.map((template) => normalizeTemplate(template));
  if (next.length) writeStoredJson(importMappingTemplateStorageKey, next);
  else removeStoredKey(importMappingTemplateStorageKey);
  emitAppSync(importMappingTemplateStorageKey);
  return next;
}

export function subscribeImportMappingTemplates(listener: () => void): () => void {
  return subscribeAppSync(STORAGE_KEYS, listener);
}

export function loadImportMappingTemplates(): ImportMappingTemplate[] {
  const templates = readStoredJson<ImportMappingTemplate[]>(importMappingTemplateStorageKey, []);
  return Array.isArray(templates) ? templates.map((template) => normalizeTemplate(template as StoredTemplateInput)) : [];
}

export function saveImportMappingTemplate(template: StoredTemplateInput): ImportMappingTemplate {
  const current = loadImportMappingTemplates();
  const normalized = normalizeTemplate(template);
  const matchIndex = current.findIndex((item) => {
    if (template.id && item.id === template.id) return true;
    return item.moduleId === normalized.moduleId
      && item.headerSignature === normalized.headerSignature
      && (item.sourceProfileId ?? "") === (normalized.sourceProfileId ?? "");
  });

  const existing = matchIndex >= 0 ? current[matchIndex] : null;
  const next: ImportMappingTemplate = {
    ...normalized,
    id: existing?.id ?? normalized.id,
    createdAt: existing?.createdAt ?? normalized.createdAt,
    usageCount: existing?.usageCount ?? normalized.usageCount,
    lastUsedAt: existing?.lastUsedAt ?? normalized.lastUsedAt,
    updatedAt: new Date().toISOString(),
  };

  const nextTemplates = [...current];
  if (matchIndex >= 0) nextTemplates[matchIndex] = next;
  else nextTemplates.unshift(next);
  persistTemplates(nextTemplates);
  return next;
}

export function recordImportMappingTemplateUsage(id: string): ImportMappingTemplate | null {
  const current = loadImportMappingTemplates();
  const index = current.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const updated: ImportMappingTemplate = {
    ...current[index],
    usageCount: current[index].usageCount + 1,
    lastUsedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  current[index] = updated;
  persistTemplates(current);
  return updated;
}

export function deleteImportMappingTemplate(id: string): void {
  const next = loadImportMappingTemplates().filter((template) => template.id !== id);
  persistTemplates(next);
}

export function deleteImportMappingTemplatesByProfile(profileId: string): void {
  const cleanProfileId = clean(profileId);
  if (!cleanProfileId) return;
  const next = loadImportMappingTemplates().filter((template) => template.sourceProfileId !== cleanProfileId);
  persistTemplates(next);
}

export function findImportMappingTemplate(
  headers: string[],
  moduleId: string,
  options: { customFieldIds?: string[] } = {},
): ImportMappingTemplateMatch | null {
  const headerSignature = buildHeaderSignature(headers);
  if (!headerSignature) return null;

  const templates = loadImportMappingTemplates().filter(
    (template) => template.moduleId === clean(moduleId) && template.headerSignature === headerSignature,
  );

  if (!templates.length) return null;

  const requestedCustomFields = buildCustomFieldSignature(options.customFieldIds ?? []);
  const sorted = [...templates].sort((left, right) => {
    const leftCustom = buildCustomFieldSignature(left.customFieldIds) === requestedCustomFields ? 1 : 0;
    const rightCustom = buildCustomFieldSignature(right.customFieldIds) === requestedCustomFields ? 1 : 0;
    if (leftCustom !== rightCustom) return rightCustom - leftCustom;
    if (right.usageCount !== left.usageCount) return right.usageCount - left.usageCount;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });

  const template = sorted[0];
  return {
    template,
    matchReason:
      template.customFieldIds.length && requestedCustomFields && buildCustomFieldSignature(template.customFieldIds) === requestedCustomFields
        ? "Recovered a saved mapping template with matching headers and custom fields."
        : "Recovered a saved mapping template with matching headers.",
  };
}
