import type { RegistryFieldConfig } from "@/lib/registry-groups";
import type {
  CanonicalFieldSource,
  CanonicalFieldStatus,
  CanonicalFieldGroup,
  CanonicalFieldType,
  CanonicalStudentField,
} from "@/lib/canonical-student-field.types";
import { CANONICAL_STUDENT_FIELDS_SEED } from "@/lib/canonical-student-fields.seed";

export { CANONICAL_STUDENT_FIELDS_SEED };

// ── Bootstrap ──────────────────────────────────────────────────────

const CANONICAL_STORAGE_KEY = 'sms.canonical-fields.student.v1';

export function getCanonicalStudentStorageKey(): string {
  return CANONICAL_STORAGE_KEY;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function loadCanonicalStudentFieldsFromStorage(): CanonicalStudentField[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(CANONICAL_STORAGE_KEY);
    if (raw) {
      const parsed: CanonicalStudentField[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return null;
}

export function saveCanonicalStudentFieldsToStorage(fields: CanonicalStudentField[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CANONICAL_STORAGE_KEY, JSON.stringify(fields));
  } catch {}
}

export function ensureCanonicalStudentFields(): CanonicalStudentField[] {
  const existing = loadCanonicalStudentFieldsFromStorage();
  if (existing) return existing;

  const now = new Date().toISOString();
  const seeded = CANONICAL_STUDENT_FIELDS_SEED.map((f) => ({
    ...f,
    createdAt: now,
    updatedAt: now,
  }));

  saveCanonicalStudentFieldsToStorage(seeded);
  return seeded;
}

export function isCanonicalFieldSeeded(): boolean {
  return loadCanonicalStudentFieldsFromStorage() !== null;
}

export function getCanonicalFieldByKey(key: string): CanonicalStudentField | undefined {
  return CANONICAL_STUDENT_FIELDS_SEED.find((f) => f.key === key);
}

export function getCanonicalFieldsByGroup(group: CanonicalFieldGroup): CanonicalStudentField[] {
  return CANONICAL_STUDENT_FIELDS_SEED.filter((f) => f.group === group).sort((a, b) => a.order - b.order);
}

export function getCanonicalGroupLabels(): CanonicalFieldGroup[] {
  const groups = new Set(CANONICAL_STUDENT_FIELDS_SEED.map((f) => f.group));
  return Array.from(groups).sort();
}

// ── Bridge to RegistryFieldConfig ──────────────────────────────────

const CANONICAL_GROUP_TO_LEGACY_GROUP: Record<CanonicalFieldGroup, string> = {
  'Basic Information': 'basicInfo',
  'Institute Information': 'instituteInfo',
  'Course Information': 'courseInfo',
  'Academic Information': 'academic',
  'Personal Information': 'personal',
  'Contact Information': 'contact',
  'Family Information': 'family',
  'Hostel Information': 'hostel',
  'Scholarship Information': 'scholarship',
  'Banking Information': 'banking',
  'Documents & Identity': 'documents',
  'Other Information': 'other',
  'General Information': 'general',
  'Head of the Institute': 'headOfInstitute',
  'Nodal Officer': 'nodalOfficer',
};

function canonicalTypeToLegacyType(t: CanonicalFieldType): RegistryFieldConfig['type'] {
  if (t === 'textarea') return 'text';
  if (t === 'select') return 'enum';
  return t;
}

function canonicalSourceToLegacySource(s: CanonicalFieldSource): RegistryFieldConfig['source'] {
  if (s === 'base' || s === 'custom') return s === 'base' ? 'system' : 'custom';
  if (s === 'import' || s === 'fetched') return 'import';
  return 'detected';
}

function canonicalStatusToLegacyStatus(s: CanonicalFieldStatus): RegistryFieldConfig['status'] {
  if (s === 'active') return 'active';
  if (s === 'archived') return 'hidden';
  return 'deprecated';
}

export function canonicalFieldToRegistryConfig(field: CanonicalStudentField): RegistryFieldConfig {
  return {
    scope: 'student',
    key: field.key,
    label: field.label,
    source: canonicalSourceToLegacySource(field.source),
    type: canonicalTypeToLegacyType(field.type),
    defaultValue: field.defaultValue,
    options: field.options,
    notes: field.notes,
    groupKey: CANONICAL_GROUP_TO_LEGACY_GROUP[field.group] ?? 'other',
    order: field.order,
    aliases: field.aliases,
    status: canonicalStatusToLegacyStatus(field.status),
    createdAt: field.createdAt,
    updatedAt: field.updatedAt,
  };
}

export function getCanonicalRegistryCatalog(): RegistryFieldConfig[] {
  return ensureCanonicalStudentFields().map(canonicalFieldToRegistryConfig);
}

export function getCanonicalRegistryCatalogFromSeed(): RegistryFieldConfig[] {
  return CANONICAL_STUDENT_FIELDS_SEED.map(canonicalFieldToRegistryConfig);
}

// ── Detected Headers Export ─────────────────────────────────────────

export interface DetectedHeaderEntry {
  label: string;
  key: string;
  group: string;
  type: string;
  status: string;
}

export function getHeaderRegistryStudioDetectedEntries(scope: string): DetectedHeaderEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  const entries: DetectedHeaderEntry[] = [];
  try {
    const raw = localStorage.getItem('sms.header-registry.fetched-headers.v1');
    if (raw) {
      const headers: { name: string; label: string }[] = JSON.parse(raw);
      if (Array.isArray(headers)) {
        const metaRaw = localStorage.getItem('sms.header-registry.fetched-meta.v1');
        let meta: Record<string, { type?: string; label?: string }> = {};
        if (metaRaw) { const p = JSON.parse(metaRaw); if (typeof p === 'object' && !Array.isArray(p)) meta = p; }

        for (const h of headers) {
          const m = meta[h.name] || meta[h.label] || {};
          const label = m.label || h.label || h.name;
          const key = h.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          entries.push({
            label,
            key,
            group: m.type ? 'Detected' : 'Other Information',
            type: m.type || 'text',
            status: 'active',
          });
        }
      }
    }
  } catch {}
  return entries;
}

function csvEscape(val: string): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportDetectedHeadersToCsv(scope: string): string {
  const entries = getHeaderRegistryStudioDetectedEntries(scope);
  const header = 'label,key,group,type,status';
  const rows = entries.map(e => [e.label, e.key, e.group, e.type, e.status].map(csvEscape).join(','));
  return [header, ...rows].join('\n');
}
