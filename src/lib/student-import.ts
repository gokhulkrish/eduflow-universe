import "@/lib/runtime-storage";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { emitAppSync } from "@/lib/app-sync";
import { studentRegisterSyncKey } from "@/lib/student-records";
import { tableExists, tablesExist } from "@/lib/supabase-health";
import { trackFetchedHeader } from "@/lib/header-registry";

export const importTransferRules = [
  "New Entry Only",
  "Update Existing Only",
  "Insert New, Ignore Existing",
  "Update If Blank",
  "Overwrite Always (Safe)",
  "Overwrite Including Blanks",
  "Reject If Changed",
  "Skip If Changed",
] as const;

export type ImportTransferRule = (typeof importTransferRules)[number];

export const importMatchDesigns = [
  { v: "reg_umis_emis", l: "Registration / UMIS / EMIS (recommended)" },
  { v: "registration_only", l: "Registration Number Only" },
  { v: "umis_only", l: "UMIS ID Only" },
  { v: "name_dob", l: "Name + Date of Birth (exact)" },
  { v: "fuzzy_name_dob", l: "Fuzzy Name + DOB (similarity)" },
  { v: "reg_or_name_dob", l: "Registration OR Name + DOB" },
] as const;

export type ImportMatchDesign = (typeof importMatchDesigns)[number]["v"];

export const importFieldGroups = [
  {
    title: "Identity",
    fields: [
      { key: "fullName", label: "Full Name", aliases: ["name", "student_name", "studentname", "full_name", "student full name"] },
      { key: "firstName", label: "First Name", aliases: ["first_name", "firstname", "given_name", "student first name"] },
      { key: "lastName", label: "Last Name", aliases: ["last_name", "lastname", "surname", "family_name"] },
      { key: "admissionNo", label: "Admission No", aliases: ["admission_no", "admission number", "registration_no", "register number", "reg_no", "roll_no"] },
      { key: "dob", label: "Date of Birth", aliases: ["dob", "birthdate", "date of birth", "dateofbirth"] },
      { key: "gender", label: "Gender", aliases: ["gender", "sex"] },
      { key: "bloodGroup", label: "Blood Group", aliases: ["blood group", "bloodgroup", "blood"] },
      { key: "nationality", label: "Nationality", aliases: ["nationality", "country"] },
      { key: "status", label: "Student Status", aliases: ["status", "student status"] },
    ],
  },
  {
    title: "Academic",
    fields: [
      { key: "grade", label: "Grade", aliases: ["grade", "class", "standard", "level"] },
      { key: "section", label: "Section", aliases: ["section", "division", "sec"] },
      { key: "roll", label: "Roll Number", aliases: ["roll", "roll_no", "roll number"] },
      { key: "stream", label: "Stream", aliases: ["stream", "group"] },
      { key: "house", label: "House", aliases: ["house"] },
      { key: "academicYear", label: "Academic Year", aliases: ["academic year", "year", "session"] },
      { key: "feeStatus", label: "Fee Status", aliases: ["fee status", "fees", "fee"] },
      { key: "attendancePercent", label: "Attendance Percent", aliases: ["attendance", "attendance percent", "attendance percentage"] },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "email", label: "Email", aliases: ["email", "e-mail"] },
      { key: "phone", label: "Phone", aliases: ["phone", "mobile", "mobile number", "student mobile", "contact"] },
      { key: "alternatePhone", label: "Alternate Phone", aliases: ["alternate phone", "alt phone", "secondary phone"] },
      { key: "address", label: "Address", aliases: ["address", "address line", "mailing address"] },
      { key: "district", label: "District", aliases: ["district"] },
      { key: "block", label: "Block", aliases: ["block"] },
    ],
  },
  {
    title: "Guardian",
    fields: [
      { key: "fatherName", label: "Father's Name", aliases: ["father name", "father_name", "father"] },
      { key: "fatherOccupation", label: "Father's Occupation", aliases: ["father occupation", "father_job"] },
      { key: "motherName", label: "Mother's Name", aliases: ["mother name", "mother_name", "mother"] },
      { key: "motherOccupation", label: "Mother's Occupation", aliases: ["mother occupation", "mother_job"] },
      { key: "guardianName", label: "Guardian Name", aliases: ["guardian name", "guardian", "guardian_full_name"] },
      { key: "guardianOccupation", label: "Guardian Occupation", aliases: ["guardian occupation"] },
      { key: "guardianPhone", label: "Guardian Phone", aliases: ["guardian phone", "parent phone", "parent mobile"] },
      { key: "guardianEmail", label: "Guardian Email", aliases: ["guardian email", "parent email"] },
      { key: "annualIncome", label: "Annual Income", aliases: ["annual income", "income"] },
    ],
  },
  {
    title: "UMIS / Scholarship",
    fields: [
      { key: "umisId", label: "UMIS ID", aliases: ["umis id", "umis_id", "umis", "student umis"] },
      { key: "emisId", label: "EMIS ID", aliases: ["emis id", "emis_id", "emis", "student emis"] },
      { key: "community", label: "Community", aliases: ["community", "caste", "category"] },
      { key: "firstGraduate", label: "First Graduate", aliases: ["first graduate", "first_graduate"] },
      { key: "incomeVerified", label: "Income Verification", aliases: ["income verified", "income verification", "verification status"] },
      { key: "scholarshipNotes", label: "Scholarship Notes", aliases: ["notes", "scholarship notes", "remarks"] },
    ],
  },
] as const;

export type ImportTargetFieldKey =
  | "fullName" | "firstName" | "lastName" | "admissionNo" | "dob" | "gender" | "bloodGroup" | "nationality" | "status"
  | "grade" | "section" | "roll" | "stream" | "house" | "academicYear" | "feeStatus" | "attendancePercent"
  | "email" | "phone" | "alternatePhone" | "address" | "district" | "block"
  | "fatherName" | "fatherOccupation" | "motherName" | "motherOccupation" | "guardianName" | "guardianOccupation" | "guardianPhone" | "guardianEmail" | "annualIncome"
  | "umisId" | "emisId" | "community" | "firstGraduate" | "incomeVerified" | "scholarshipNotes";
export type ImportTargetField = { key: ImportTargetFieldKey; label: string; aliases: readonly string[] };

export const importTargetFields = (importFieldGroups as readonly { fields: readonly ImportTargetField[] }[])
  .flatMap((group) => group.fields);
export const importTargetFieldOptions = importTargetFields.map((field) => ({
  key: field.key,
  label: field.label,
}));

export const importStorageKeys = {
  customFields: "sms.import.custom-fields.v1",
  profiles: "sms.import-profiles.v1",
} as const;

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

export type ImportCustomFieldDefinition = {
  id: string;
  key: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "select";
  options: string[];
  defaultValue: string;
  notes: string;
  aliases: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type ImportProfile = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  rule: ImportTransferRule;
  design: ImportMatchDesign;
  threshold: number;
  mapping: Record<string, string>;
  groupOverrides: Record<string, ImportDuplicateGroupDecision>;
  actionOverrides: Record<string, ImportResolvedAction>;
  customFieldIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ImportTargetBinding = ImportTargetFieldKey | `custom:${string}` | "ignore";

export type ImportMappingConflict = {
  target: ImportTargetBinding;
  keptHeader: string;
  droppedHeaders: string[];
  score: number;
  reason: string;
};

export type ImportAutoMappingReport = {
  mapping: Record<string, ImportTargetBinding>;
  conflicts: ImportMappingConflict[];
};

const getCustomFieldBindingKey = (id: string): `custom:${string}` => `custom:${id}`;

export function getImportTargetFieldGroups(customFields: ImportCustomFieldDefinition[] = []) {
  const customGroup = customFields.length
    ? [{
        title: "Custom",
        fields: customFields.map((field) => ({
          key: getCustomFieldBindingKey(field.id),
          label: field.label || field.key,
          aliases: [field.key, field.label, ...(field.aliases ?? [])].filter(Boolean),
        })),
      }]
    : [];

  return [...importFieldGroups, ...customGroup];
}

export function getImportTargetFieldOptions(customFields: ImportCustomFieldDefinition[] = []) {
  return [
    ...importTargetFieldOptions,
    ...customFields.map((field) => ({
      key: getCustomFieldBindingKey(field.id),
      label: field.label || field.key,
    })),
  ];
}

export type ImportSourceRow = Record<string, string>;

export type ParsedImportFile = {
  fileName: string;
  sourceType: "csv" | "xls" | "xlsx" | "unknown";
  sheetName: string;
  headers: string[];
  rows: ImportSourceRow[];
};

export type ImportResolvedAction = "insert" | "update" | "skip" | "review";
export type ImportMatchStatus = "exact" | "fuzzy" | "none" | "internal-duplicate";
export type ImportDuplicateGroupDecision = "keep-first" | "keep-last" | "skip-group" | "manual-review" | "match-existing";

export type ExistingStudentRecord = {
  student_id: string;
  enrollment_id: string | null;
  class_id: string | null;
  guardian_id: string | null;
  admission_no: string;
  first_name: string;
  last_name: string | null;
  display_name: string;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  alternate_phone: string | null;
  address: string | null;
  umis_id: string | null;
  emis_id: string | null;
  community: string | null;
  first_graduate: boolean;
  income_verification_status: string;
  scholarship_notes: string | null;
  fee_status: string;
  attendance_percent: number;
  status: string;
  updated_at: string;
  academic_year: string | null;
  grade: string | null;
  section: string | null;
  roll_number: number | null;
  stream: string | null;
  house: string | null;
  enrollment_status: string | null;
  guardian_name: string | null;
  guardian_occupation: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  guardian_annual_income: number | null;
};

export type ImportPreviewRow = {
  sourceRowIndex: number;
  rowKey: string;
  sourceRow: ImportSourceRow;
  mapped: Record<ImportTargetFieldKey, string>;
  customValues: Record<string, string>;
  displayName: string;
  admissionNo: string;
  identityKey: string;
  duplicateGroupSize: number;
  duplicateStatus: ImportMatchStatus;
  validationIssues: string[];
  existing: ExistingStudentRecord | null;
  matchScore: number;
  matchReason: string;
  defaultAction: ImportResolvedAction;
  action: ImportResolvedAction;
  diffSummary: string[];
};

export type ImportPreviewSummary = {
  total: number;
  valid: number;
  invalid: number;
  inserts: number;
  updates: number;
  skips: number;
  reviews: number;
  exactMatches: number;
  fuzzyMatches: number;
  internalDuplicates: number;
};

export type ImportCommitResult = {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { rowNumber: number; message: string }[];
};

export type ImportPreviewState = {
  rows: ImportPreviewRow[];
  summary: ImportPreviewSummary;
};

export type ImportBatchHistoryEntry = {
  id: string;
  batchName: string;
  fileName: string;
  description: string | null;
  rule: ImportTransferRule;
  design: ImportMatchDesign;
  threshold: number;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  createdAt: string;
};

const clean = (value: unknown) => String(value ?? "").trim();

const normalizeLoose = (value: string) =>
  clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeKey = (value: string) => normalizeLoose(value).replace(/\s+/g, "");

const normalizeDate = (value: unknown) => {
  const raw = clean(value);
  if (!raw) return "";
  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const slashed = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashed) {
    const [, a, b, c] = slashed;
    const year = c.length === 2 ? `20${c}` : c;
    const first = Number(a);
    const second = Number(b);
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second > 12 ? first : second;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;
  return new Date(parsed).toISOString().slice(0, 10);
};

const splitFullName = (value: string) => {
  const parts = normalizeLoose(value).split(" ").filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const normalizeFieldValue = (field: ImportTargetFieldKey, value: string) => {
  const raw = clean(value);
  if (!raw) return "";
  if (field === "dob") return normalizeDate(raw);
  if (field === "attendancePercent") {
    const parsed = Number(raw.replace(/%$/, ""));
    return Number.isFinite(parsed) ? String(Math.max(0, Math.min(100, parsed))) : raw;
  }
  if (field === "annualIncome" || field === "roll") {
    const numeric = raw.replace(/[^0-9.-]/g, "");
    return numeric;
  }
  return raw;
};

const normalizeCustomFieldValue = (field: ImportCustomFieldDefinition, value: string) => {
  const raw = clean(value);
  if (!raw) return "";
  if (field.type === "date") return normalizeDate(raw);
  if (field.type === "number") {
    const numeric = raw.replace(/[^0-9.-]/g, "");
    return numeric;
  }
  if (field.type === "select") {
    const allowed = field.options.map((option) => normalizeLoose(option));
    const normalized = normalizeLoose(raw);
    if (allowed.includes(normalized)) return raw;
  }
  return raw;
};

type ImportFieldCandidate = {
  key: ImportTargetBinding;
  label: string;
  aliases: readonly string[];
};

const textScore = (left: string, right: string) => {
  const a = normalizeLoose(left);
  const b = normalizeLoose(right);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.92;
  const leftTokens = a.split(" ");
  const rightTokens = b.split(" ");
  const overlap = rightTokens.filter((token) => leftTokens.includes(token)).length;
  if (!overlap) return 0;
  return overlap / Math.max(leftTokens.length, rightTokens.length);
};

const similarity = (left: string, right: string) => {
  const a = normalizeLoose(left);
  const b = normalizeLoose(right);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const max = Math.max(a.length, b.length);
  return 1 - matrix[a.length][b.length] / max;
};

const maybeTrim = (value: string | null | undefined) => {
  const next = clean(value);
  return next || "";
};

const getFieldScore = (header: string, field: ImportFieldCandidate) => {
  const normalizedHeader = normalizeLoose(header);
  if (!normalizedHeader) return 0;
  let best = 0;
  for (const alias of [field.label, ...field.aliases]) {
    const normalizedAlias = normalizeLoose(alias);
    if (!normalizedAlias) continue;
    const direct = textScore(normalizedHeader, normalizedAlias);
    const fuzzy = similarity(normalizedHeader, normalizedAlias);
    best = Math.max(best, direct, fuzzy);
  }
  return best;
};

const getBestCandidateForHeader = (
  header: string,
  candidates: ImportFieldCandidate[],
  minimumScore: number,
) => {
  let bestField: ImportTargetBinding | null = null;
  let bestScore = 0;

  for (const field of candidates) {
    const score = getFieldScore(header, field);
    if (score > bestScore) {
      bestScore = score;
      bestField = field.key;
    }
  }

  return {
    header,
    target: bestField && bestScore >= minimumScore ? bestField : ("ignore" as ImportTargetBinding),
    score: bestScore,
  };
};

const buildImportFieldCandidates = (customFields: ImportCustomFieldDefinition[] = []) => [
  ...importTargetFields.map((field) => ({
    key: field.key,
    label: field.label,
    aliases: field.aliases,
  })),
  ...customFields.map((field) => ({
    key: getCustomFieldBindingKey(field.id),
    label: field.label || field.key,
    aliases: [field.key, field.label, ...field.aliases].filter(Boolean),
  })),
];

const matchHeadersToFields = (
  headers: string[],
  customFields: ImportCustomFieldDefinition[] = [],
  minimumScore = 0.62,
) => {
  const mapping: Record<string, ImportTargetBinding> = {};
  const candidates = buildImportFieldCandidates(customFields);

  for (const header of headers) {
    const best = getBestCandidateForHeader(header, candidates, minimumScore);
    mapping[header] = best.target;
  }

  return mapping;
};

export function buildAutoMappingReport(
  headers: string[],
  customFields: ImportCustomFieldDefinition[] = [],
  options: {
    preferredBindings?: Record<string, ImportTargetBinding>;
    minimumScore?: number;
  } = {},
): ImportAutoMappingReport {
  const preferredBindings = options.preferredBindings ?? {};
  const minimumScore = options.minimumScore ?? 0.62;
  const candidates = buildImportFieldCandidates(customFields);
  const entries = headers.map((header) => getBestCandidateForHeader(header, candidates, minimumScore));
  const mapping: Record<string, ImportTargetBinding> = {};
  const order = new Map(headers.map((header, index) => [header, index]));
  const preferredHeaders = new Set(Object.keys(preferredBindings));

  for (const entry of entries) {
    mapping[entry.header] = entry.target;
  }

  for (const [header, target] of Object.entries(preferredBindings)) {
    if (headers.includes(header) && target) {
      mapping[header] = target;
    }
  }

  const conflicts: ImportMappingConflict[] = [];
  const byTarget = new Map<ImportTargetBinding, typeof entries>();
  for (const entry of entries) {
    const target = mapping[entry.header];
    if (!target || target === "ignore") continue;
    const next = byTarget.get(target) ?? [];
    next.push(entry);
    byTarget.set(target, next);
  }

  for (const [target, grouped] of byTarget.entries()) {
    if (grouped.length < 2) continue;

    const sorted = [...grouped].sort((left, right) => {
      const leftPreferred = preferredHeaders.has(left.header) ? 1 : 0;
      const rightPreferred = preferredHeaders.has(right.header) ? 1 : 0;
      if (leftPreferred !== rightPreferred) return rightPreferred - leftPreferred;
      if (right.score !== left.score) return right.score - left.score;
      return (order.get(left.header) ?? 0) - (order.get(right.header) ?? 0);
    });

    const [winner, ...losers] = sorted;
    mapping[winner.header] = target;
    for (const loser of losers) {
      mapping[loser.header] = "ignore";
    }

    conflicts.push({
      target,
      keptHeader: winner.header,
      droppedHeaders: losers.map((entry) => entry.header),
      score: winner.score,
      reason: `Resolved duplicate mapping for "${String(target)}" by keeping "${winner.header}".`,
    });
  }

  return { mapping, conflicts };
}

const countBy = <T,>(items: T[], keyFn: (item: T) => string) => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

export function loadCustomImportFields(): ImportCustomFieldDefinition[] {
  const fields = readStoredJson<ImportCustomFieldDefinition[]>(importStorageKeys.customFields, []);
  return Array.isArray(fields) ? fields : [];
}

export function saveCustomImportField(
  field: Omit<ImportCustomFieldDefinition, "id" | "version" | "createdAt" | "updatedAt"> & { id?: string; version?: number }
) {
  const now = new Date().toISOString();
  const fields = loadCustomImportFields();
  const id = field.id || crypto.randomUUID();
  const next = {
    id,
    key: clean(field.key) || id,
    label: clean(field.label) || clean(field.key) || id,
    type: field.type,
    options: Array.isArray(field.options) ? field.options.filter(Boolean) : [],
    defaultValue: clean(field.defaultValue),
    notes: clean(field.notes),
    aliases: Array.isArray(field.aliases) ? field.aliases.filter(Boolean) : [],
    version: (fields.find((item) => item.id === id)?.version ?? field.version ?? 0) + 1,
    createdAt: fields.find((item) => item.id === id)?.createdAt ?? now,
    updatedAt: now,
  } satisfies ImportCustomFieldDefinition;

  const nextList = fields.filter((item) => item.id !== id).concat(next);
  writeStoredJson(importStorageKeys.customFields, nextList);
  emitAppSync(importStorageKeys.customFields);
  return next;
}

export function deleteCustomImportField(id: string) {
  const next = loadCustomImportFields().filter((field) => field.id !== id);
  if (next.length) writeStoredJson(importStorageKeys.customFields, next);
  else removeStoredKey(importStorageKeys.customFields);
  emitAppSync(importStorageKeys.customFields);
}

export function loadImportProfiles(): ImportProfile[] {
  const profiles = readStoredJson<ImportProfile[]>(importStorageKeys.profiles, []);
  return Array.isArray(profiles) ? profiles : [];
}

export function saveImportProfile(
  profile: Omit<ImportProfile, "id" | "version" | "createdAt" | "updatedAt"> & { id?: string; version?: number }
) {
  const now = new Date().toISOString();
  const profiles = loadImportProfiles();
  const id = profile.id || crypto.randomUUID();
  const existing = profiles.find((item) => item.id === id) ?? null;
  const next = {
    id,
    name: clean(profile.name) || "Unnamed profile",
    description: profile.description ? clean(profile.description) : null,
    version: (existing?.version ?? profile.version ?? 0) + 1,
    rule: profile.rule,
    design: profile.design,
    threshold: Math.max(0, Math.min(100, Number(profile.threshold) || 88)),
    mapping: { ...(profile.mapping ?? {}) },
    groupOverrides: { ...(profile.groupOverrides ?? {}) },
    actionOverrides: { ...(profile.actionOverrides ?? {}) },
    customFieldIds: Array.isArray(profile.customFieldIds) ? profile.customFieldIds.filter(Boolean) : [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  } satisfies ImportProfile;

  const nextList = profiles.filter((item) => item.id !== id).concat(next);
  writeStoredJson(importStorageKeys.profiles, nextList);
  emitAppSync(importStorageKeys.profiles);
  return next;
}

export function deleteImportProfile(id: string) {
  const next = loadImportProfiles().filter((profile) => profile.id !== id);
  if (next.length) writeStoredJson(importStorageKeys.profiles, next);
  else removeStoredKey(importStorageKeys.profiles);
  emitAppSync(importStorageKeys.profiles);
}

export function buildAutoMapping(headers: string[], customFields: ImportCustomFieldDefinition[] = []) {
  return buildAutoMappingReport(headers, customFields).mapping;
}

export async function parseImportFile(file: File): Promise<ParsedImportFile> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const sourceType = extension === "csv" ? "csv" : extension === "xls" ? "xls" : extension === "xlsx" ? "xlsx" : "unknown";
  const workbook = extension === "csv"
    ? XLSX.read(await file.text(), { type: "string", cellDates: true, raw: false })
    : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, raw: false });

  const sheetName = workbook.SheetNames[0] ?? "Sheet1";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("The selected file does not contain a readable sheet.");

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    raw: false,
    defval: "",
  }) as unknown[][];

  const headers = (matrix[0] ?? []).map((value, index) => maybeTrim(String(value)) || `Column ${index + 1}`);

  // Track discovered columns in the fetched headers store
  for (const header of headers) {
    trackFetchedHeader(header, header);
  }

  const rows = matrix
    .slice(1)
    .map((values) => {
      const row: ImportSourceRow = {};
      headers.forEach((header, index) => {
        const cell = maybeTrim(String(values?.[index] ?? ""));
        if (cell) row[header] = cell;
      });
      return row;
    })
    .filter((row) => Object.values(row).some((value) => Boolean(maybeTrim(value))));

  return { fileName: file.name, sourceType, sheetName, headers, rows };
}

const readStudentDisplayName = (row: Pick<ExistingStudentRecord, "display_name" | "first_name" | "last_name">) =>
  maybeTrim(row.display_name) || [row.first_name, row.last_name].filter(Boolean).join(" ");

const normalizeExistingRow = (row: Tables<"student_register">): ExistingStudentRecord => ({
  student_id: String(row.student_id ?? ""),
  enrollment_id: row.enrollment_id ? String(row.enrollment_id) : null,
  class_id: null,
  guardian_id: row.guardian_id ? String(row.guardian_id) : null,
  admission_no: String(row.admission_no ?? ""),
  first_name: String(row.first_name ?? ""),
  last_name: typeof row.last_name === "string" ? row.last_name : null,
  display_name: String(row.display_name ?? ""),
  dob: typeof row.dob === "string" ? row.dob : null,
  gender: typeof row.gender === "string" ? row.gender : null,
  blood_group: typeof row.blood_group === "string" ? row.blood_group : null,
  nationality: typeof row.nationality === "string" ? row.nationality : null,
  email: typeof row.email === "string" ? row.email : null,
  phone: typeof row.phone === "string" ? row.phone : null,
  alternate_phone: typeof row.alternate_phone === "string" ? row.alternate_phone : null,
  address: typeof row.address === "string" ? row.address : null,
  umis_id: typeof row.umis_id === "string" ? row.umis_id : null,
  emis_id: typeof row.emis_id === "string" ? row.emis_id : null,
  community: typeof row.community === "string" ? row.community : null,
  first_graduate: Boolean(row.first_graduate),
  income_verification_status: String(row.income_verification_status ?? ""),
  scholarship_notes: typeof row.scholarship_notes === "string" ? row.scholarship_notes : null,
  fee_status: String(row.fee_status ?? "Pending"),
  attendance_percent: Number(row.attendance_percent ?? 0),
  status: String(row.status ?? "active"),
  updated_at: String(row.updated_at ?? ""),
  academic_year: typeof row.academic_year === "string" ? row.academic_year : null,
  grade: typeof row.grade === "string" ? row.grade : null,
  section: typeof row.section === "string" ? row.section : null,
  roll_number: typeof row.roll_number === "number" ? row.roll_number : null,
  stream: typeof row.stream === "string" ? row.stream : null,
  house: typeof row.house === "string" ? row.house : null,
  enrollment_status: typeof row.enrollment_status === "string" ? row.enrollment_status : null,
  guardian_name: typeof row.guardian_name === "string" ? row.guardian_name : null,
  guardian_occupation: typeof row.guardian_occupation === "string" ? row.guardian_occupation : null,
  guardian_phone: typeof row.guardian_phone === "string" ? row.guardian_phone : null,
  guardian_email: typeof row.guardian_email === "string" ? row.guardian_email : null,
  guardian_annual_income: typeof row.guardian_annual_income === "number" ? row.guardian_annual_income : null,
});

const normalizeFallbackRows = (
  students: Tables<"students">[],
  enrollments: Array<Partial<Tables<"enrollments">> & Pick<Tables<"enrollments">, "id" | "student_id" | "created_at">>
): ExistingStudentRecord[] => {
  const latestEnrollmentByStudent = new Map<string, Partial<Tables<"enrollments">> & Pick<Tables<"enrollments">, "id" | "student_id" | "created_at">>();
  for (const enrollment of enrollments) {
    const current = latestEnrollmentByStudent.get(enrollment.student_id);
    if (!current) {
      latestEnrollmentByStudent.set(enrollment.student_id, enrollment);
      continue;
    }
    const currentTime = new Date(current.created_at).getTime();
    const nextTime = new Date(enrollment.created_at).getTime();
    if (nextTime >= currentTime) latestEnrollmentByStudent.set(enrollment.student_id, enrollment);
  }

  const readMetaString = (meta: unknown, group: string, key: string) => {
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "";
    const section = (meta as Record<string, unknown>)[group];
    if (!section || typeof section !== "object" || Array.isArray(section)) return "";
    const value = (section as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
  };

  const readMetaNumber = (meta: unknown, group: string, key: string) => {
    const next = Number(readMetaString(meta, group, key));
    return Number.isFinite(next) ? next : null;
  };

  return students.map((student) => {
    const enrollment = latestEnrollmentByStudent.get(student.id) ?? null;
    const meta = student.meta;
    const academicGrade = String(enrollment?.grade_label ?? readMetaString(meta, "academic", "grade") ?? "").trim() || null;
    const academicSection = String(enrollment?.section_label ?? readMetaString(meta, "academic", "section") ?? "").trim() || null;
    const academicStream = String(enrollment?.stream ?? readMetaString(meta, "academic", "stream") ?? "").trim() || null;
    return {
      student_id: student.id,
      enrollment_id: enrollment?.id ?? null,
      class_id: null,
      guardian_id: readMetaString(meta, "family", "guardianId") || null,
      admission_no: student.admission_no,
      first_name: student.first_name,
      last_name: student.last_name,
      display_name: [student.first_name, student.last_name].filter(Boolean).join(" "),
      dob: student.dob,
      gender: student.gender,
      blood_group: student.blood_group,
      nationality: student.nationality,
      email: student.email,
      phone: student.phone,
      alternate_phone: student.alternate_phone,
      address: student.address,
      umis_id: student.umis_id,
      emis_id: student.emis_id,
      community: student.community,
      first_graduate: Boolean(student.first_graduate),
      income_verification_status: student.income_verification_status,
      scholarship_notes: student.scholarship_notes,
      fee_status: student.fee_status,
      attendance_percent: Number(student.attendance_percent ?? 0),
      status: student.status,
      updated_at: student.updated_at,
      academic_year: readMetaString(meta, "academic", "academicYear") || null,
      grade: academicGrade || null,
      section: academicSection || null,
      roll_number: typeof enrollment?.roll_number === "number" ? enrollment.roll_number : readMetaNumber(meta, "academic", "roll"),
      stream: academicStream || null,
      house: readMetaString(meta, "academic", "house") || null,
      enrollment_status: enrollment?.status ?? null,
      guardian_name: readMetaString(meta, "family", "guardianName") || readMetaString(meta, "family", "fatherName") || readMetaString(meta, "family", "motherName") || null,
      guardian_occupation: readMetaString(meta, "family", "guardianOccupation") || readMetaString(meta, "family", "fatherOccupation") || readMetaString(meta, "family", "motherOccupation") || null,
      guardian_phone: readMetaString(meta, "family", "guardianPhone") || null,
      guardian_email: readMetaString(meta, "family", "guardianEmail") || null,
      guardian_annual_income: readMetaNumber(meta, "family", "annualIncome"),
    };
  });
};

export async function loadExistingStudentsForImport() {
  const [studentsResult, enrollmentsResult] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .order("updated_at", { ascending: false }),
    supabase
      .from("enrollments")
      .select("id,student_id,academic_year_id,class_level_id,section_id,roll_number,status,created_at,updated_at,grade_label,section_label,stream,meta")
      .order("created_at", { ascending: false }),
  ]);

  if (studentsResult.error) throw new Error(studentsResult.error.message);
  if (enrollmentsResult.error) throw new Error(enrollmentsResult.error.message);

  return normalizeFallbackRows(
    studentsResult.data ?? [],
    enrollmentsResult.data ?? []
  );
}

const buildIdentityKey = (row: Record<ImportTargetFieldKey, string>, design: ImportMatchDesign) => {
  const admission = normalizeKey(row.admissionNo);
  const umis = normalizeKey(row.umisId);
  const emis = normalizeKey(row.emisId);
  const name = normalizeKey([row.firstName, row.lastName].filter(Boolean).join(" ") || row.fullName);
  const dob = normalizeKey(row.dob);

  switch (design) {
    case "registration_only":
      return admission ? `reg:${admission}` : `name:${name}|dob:${dob}`;
    case "umis_only":
      return umis ? `umis:${umis}` : emis ? `emis:${emis}` : admission ? `reg:${admission}` : `name:${name}|dob:${dob}`;
    case "name_dob":
    case "fuzzy_name_dob":
      return name && dob ? `name:${name}|dob:${dob}` : admission ? `reg:${admission}` : `name:${name}|dob:${dob}`;
    case "reg_or_name_dob":
      return admission ? `reg:${admission}` : name && dob ? `name:${name}|dob:${dob}` : umis ? `umis:${umis}` : emis ? `emis:${emis}` : `name:${name}|dob:${dob}`;
    default:
      return admission ? `reg:${admission}` : umis ? `umis:${umis}` : emis ? `emis:${emis}` : name && dob ? `name:${name}|dob:${dob}` : `name:${name}`;
  }
};

const getExistingMatch = (
  row: Record<ImportTargetFieldKey, string>,
  existingRows: ExistingStudentRecord[],
  design: ImportMatchDesign,
  threshold: number
) => {
  let best: { row: ExistingStudentRecord; score: number; reason: string } | null = null;

  for (const existing of existingRows) {
    const admission = normalizeKey(row.admissionNo);
    const umis = normalizeKey(row.umisId);
    const emis = normalizeKey(row.emisId);
    const existingAdmission = normalizeKey(existing.admission_no);
    const existingUmis = normalizeKey(existing.umis_id ?? "");
    const existingEmis = normalizeKey(existing.emis_id ?? "");
    const name = normalizeLoose([row.firstName, row.lastName].filter(Boolean).join(" ") || row.fullName);
    const existingName = normalizeLoose(readStudentDisplayName(existing));
    const dob = normalizeDate(row.dob);
    const existingDob = normalizeDate(existing.dob);

    let score = 0;
    let reason = "";

    if (design === "registration_only") {
      if (admission && admission === existingAdmission) {
        score = 100;
        reason = "Admission number matched";
      }
    } else if (design === "umis_only") {
      if (umis && umis === existingUmis) {
        score = 100;
        reason = "UMIS matched";
      } else if (emis && emis === existingEmis) {
        score = 98;
        reason = "EMIS matched";
      }
    } else if (design === "name_dob") {
      if (name && dob && name === existingName && dob === existingDob) {
        score = 100;
        reason = "Exact name + DOB match";
      }
    } else if (design === "fuzzy_name_dob") {
      const nameScore = similarity(name, existingName);
      const dobScore = dob && existingDob && dob === existingDob ? 1 : 0;
      score = Math.round(nameScore * 80 + dobScore * 20);
      if (score >= 60) reason = `Fuzzy name + DOB match (${score}%)`;
    } else {
      const regScore = admission && admission === existingAdmission ? 100 : 0;
      const umisScore = umis && umis === existingUmis ? 99 : 0;
      const emisScore = emis && emis === existingEmis ? 98 : 0;
      const nameScore = similarity(name, existingName);
      const dobScore = dob && existingDob && dob === existingDob ? 1 : 0;
      score = Math.max(regScore, umisScore, emisScore, Math.round(nameScore * 80 + dobScore * 20));
      if (score === regScore && regScore) reason = "Admission number matched";
      else if (score === umisScore && umisScore) reason = "UMIS matched";
      else if (score === emisScore && emisScore) reason = "EMIS matched";
      else if (score >= 60) reason = `Name + DOB similarity ${score}%`;
    }

    if (!score) continue;
    if (score < threshold * 100) continue;
    if (!best || score > best.score) best = { row: existing, score, reason: reason || "Potential match" };
  }

  return best;
};

const deriveMappedRow = (
  sourceRow: ImportSourceRow,
  headersToFields: Record<string, ImportTargetBinding>,
  customFields: ImportCustomFieldDefinition[] = []
) => {
  const mapped = Object.fromEntries(
    importTargetFields.map((field) => [field.key, ""] as const)
  ) as Record<ImportTargetFieldKey, string>;
  const customValues: Record<string, string> = {};

  for (const [header, value] of Object.entries(sourceRow)) {
    const target = headersToFields[header];
    if (!target || target === "ignore") continue;
    if (target.startsWith("custom:")) {
      const customField = customFields.find((field) => field.id === target.slice("custom:".length));
      if (customField) customValues[customField.id] = normalizeCustomFieldValue(customField, value);
      continue;
    }
    mapped[target as ImportTargetFieldKey] = normalizeFieldValue(target as ImportTargetFieldKey, value);
  }

  const fallbackName = [mapped.firstName, mapped.lastName].filter(Boolean).join(" ") || mapped.fullName;
  if (!mapped.fullName && fallbackName) mapped.fullName = fallbackName;

  if (!mapped.firstName && mapped.fullName) {
    const split = splitFullName(mapped.fullName);
    mapped.firstName = split.firstName;
    if (!mapped.lastName) mapped.lastName = split.lastName;
  }

  if (!mapped.admissionNo) {
    mapped.admissionNo = mapped.umisId || mapped.emisId || "";
  }

  return { mapped, customValues };
};

const validateRow = (row: Record<ImportTargetFieldKey, string>) => {
  const issues: string[] = [];
  if (!maybeTrim(row.admissionNo)) issues.push("Missing admission number");
  if (!maybeTrim(row.firstName)) issues.push("Missing first name");
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) issues.push("Email looks invalid");
  if (row.phone && row.phone.replace(/[^0-9+]/g, "").length < 7) issues.push("Phone looks invalid");
  if (row.dob && row.dob.length < 8) issues.push("DOB looks incomplete");
  if (row.roll && row.roll && Number.isNaN(Number(row.roll))) issues.push("Roll number must be numeric");
  if (row.attendancePercent && row.attendancePercent && (Number.isNaN(Number(row.attendancePercent)) || Number(row.attendancePercent) < 0 || Number(row.attendancePercent) > 100)) {
    issues.push("Attendance percent must be 0-100");
  }
  if (row.annualIncome && row.annualIncome && Number.isNaN(Number(row.annualIncome.replace(/[^0-9.-]/g, "")))) {
    issues.push("Annual income must be numeric");
  }
  return issues;
};

const resolveDefaultAction = (
  row: Record<ImportTargetFieldKey, string>,
  existing: ExistingStudentRecord | null,
  matchStatus: ImportMatchStatus,
  rule: ImportTransferRule,
  validationIssues: string[]
): ImportResolvedAction => {
  if (validationIssues.length) return "review";
  if (matchStatus === "internal-duplicate") return "review";
  if (!existing) {
    return rule === "Update Existing Only" ? "skip" : "insert";
  }

  const changed = rowHasMeaningfulDifference(row, existing);
  switch (rule) {
    case "New Entry Only":
    case "Insert New, Ignore Existing":
      return "skip";
    case "Update Existing Only":
      return "update";
    case "Update If Blank":
      return changed ? "update" : "skip";
    case "Overwrite Always (Safe)":
    case "Overwrite Including Blanks":
      return "update";
    case "Reject If Changed":
      return changed ? "review" : "skip";
    case "Skip If Changed":
      return changed ? "skip" : "update";
    default:
      return "review";
  }
};

const rowHasMeaningfulDifference = (row: Record<ImportTargetFieldKey, string>, existing: ExistingStudentRecord) => {
  const nextName = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fullName;
  return [
    normalizeKey(row.admissionNo) !== normalizeKey(existing.admission_no),
    normalizeLoose(nextName) !== normalizeLoose(existing.display_name),
    normalizeDate(row.dob) !== normalizeDate(existing.dob),
    normalizeKey(row.umisId) !== normalizeKey(existing.umis_id ?? ""),
    normalizeKey(row.emisId) !== normalizeKey(existing.emis_id ?? ""),
    normalizeLoose(row.grade) !== normalizeLoose(existing.grade ?? ""),
    normalizeLoose(row.section) !== normalizeLoose(existing.section ?? ""),
    normalizeLoose(row.roll) !== normalizeLoose(String(existing.roll_number ?? "")),
  ].some(Boolean);
};

const getDiffSummary = (row: Record<ImportTargetFieldKey, string>, existing: ExistingStudentRecord | null) => {
  if (!existing) {
    return ["New student record will be inserted"];
  }

  const diffs: string[] = [];
  const nextName = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fullName;
  if (normalizeLoose(nextName) !== normalizeLoose(existing.display_name)) diffs.push(`Name: ${existing.display_name || "—"} → ${nextName || "—"}`);
  if (normalizeDate(row.dob) !== normalizeDate(existing.dob)) diffs.push(`DOB: ${existing.dob || "—"} → ${row.dob || "—"}`);
  if (normalizeKey(row.admissionNo) !== normalizeKey(existing.admission_no)) diffs.push(`Admission: ${existing.admission_no} → ${row.admissionNo}`);
  if (normalizeLoose(row.grade) !== normalizeLoose(existing.grade ?? "")) diffs.push(`Grade: ${existing.grade || "—"} → ${row.grade || "—"}`);
  if (normalizeLoose(row.section) !== normalizeLoose(existing.section ?? "")) diffs.push(`Section: ${existing.section || "—"} → ${row.section || "—"}`);
  if (normalizeKey(row.roll) !== normalizeKey(String(existing.roll_number ?? ""))) diffs.push(`Roll: ${existing.roll_number ?? "—"} → ${row.roll || "—"}`);
  if (normalizeKey(row.umisId) !== normalizeKey(existing.umis_id ?? "")) diffs.push(`UMIS: ${existing.umis_id || "—"} → ${row.umisId || "—"}`);
  if (normalizeKey(row.emisId) !== normalizeKey(existing.emis_id ?? "")) diffs.push(`EMIS: ${existing.emis_id || "—"} → ${row.emisId || "—"}`);
  return diffs.length ? diffs : ["No meaningful field changes detected"];
};

const pickTextValue = (
  sourceValue: string,
  existingValue: string | null | undefined,
  rule: ImportTransferRule
) => {
  if (rule === "Overwrite Including Blanks") return sourceValue || null;
  if (rule === "Update If Blank") return existingValue || sourceValue || null;
  return sourceValue || existingValue || null;
};

const pickNumberValue = (
  sourceValue: string,
  existingValue: number | null | undefined,
  rule: ImportTransferRule
) => {
  if (rule === "Overwrite Including Blanks") {
    const next = clean(sourceValue).replace(/[^0-9.-]/g, "");
    return next ? Number(next) : null;
  }
  if (rule === "Update If Blank") return existingValue ?? (clean(sourceValue) ? Number(sourceValue) : null);
  if (clean(sourceValue)) return Number(sourceValue);
  return existingValue ?? null;
};

const pickBooleanValue = (
  sourceValue: string,
  existingValue: boolean,
  rule: ImportTransferRule
) => {
  if (rule === "Overwrite Including Blanks") {
    const normalized = normalizeLoose(sourceValue);
    if (!normalized) return false;
    return ["yes", "y", "true", "1", "active"].includes(normalized);
  }
  if (rule === "Update If Blank") return existingValue || ["yes", "y", "true", "1", "active"].includes(normalizeLoose(sourceValue));
  if (!clean(sourceValue)) return existingValue;
  return ["yes", "y", "true", "1", "active"].includes(normalizeLoose(sourceValue));
};

export function buildImportPreview(
  parsed: ParsedImportFile,
  mapping: Record<string, ImportTargetBinding>,
  existingRows: ExistingStudentRecord[],
  options: {
    design: ImportMatchDesign;
    threshold: number;
    rule: ImportTransferRule;
    customFields?: ImportCustomFieldDefinition[];
    groupOverrides?: Record<string, ImportDuplicateGroupDecision>;
    actionOverrides?: Record<string, ImportResolvedAction>;
  }
): ImportPreviewState {
  const mappedRows = parsed.rows.map((sourceRow, index) => {
    const { mapped, customValues } = deriveMappedRow(sourceRow, mapping, options.customFields ?? []);
    const displayName = [mapped.firstName, mapped.lastName].filter(Boolean).join(" ") || mapped.fullName || mapped.admissionNo || `Row ${index + 2}`;
    const identityKey = buildIdentityKey(mapped, options.design);
    const validationIssues = validateRow(mapped);
    const existing = getExistingMatch(mapped, existingRows, options.design, options.threshold);
    const matchScore = existing?.score ?? 0;
    const duplicateStatus: ImportMatchStatus = existing
      ? (matchScore >= 95 ? "exact" : "fuzzy")
      : "none";
    return {
      sourceRowIndex: index,
      rowKey: String(index),
      sourceRow,
      mapped,
      customValues,
      displayName,
      admissionNo: mapped.admissionNo,
      identityKey,
      duplicateGroupSize: 1,
      duplicateStatus,
      validationIssues,
      existing: existing?.row ?? null,
      matchScore,
      matchReason: existing?.reason ?? "No existing match found",
      defaultAction: resolveDefaultAction(mapped, existing?.row ?? null, duplicateStatus, options.rule, validationIssues),
      action: "review" as ImportResolvedAction,
      diffSummary: getDiffSummary(mapped, existing?.row ?? null),
    };
  });

  const identityCounts = countBy(mappedRows, (row) => row.identityKey);
  const normalizedRows = mappedRows.map((row) => {
    const duplicateGroupSize = identityCounts.get(row.identityKey) ?? 1;
    const duplicateStatus: ImportMatchStatus =
      row.existing
        ? row.duplicateStatus
        : duplicateGroupSize > 1
          ? "internal-duplicate"
          : "none";
    const groupDecision = options.groupOverrides?.[row.identityKey];
    let action = options.actionOverrides?.[row.rowKey] ?? row.defaultAction;

    if (!options.actionOverrides?.[row.rowKey] && groupDecision) {
      const groupRows = mappedRows.filter((candidate) => candidate.identityKey === row.identityKey);
      const groupIndex = groupRows.findIndex((candidate) => candidate.rowKey === row.rowKey);
      const lastIndex = groupRows.length - 1;

      if (groupDecision === "skip-group") {
        action = "skip";
      } else if (groupDecision === "manual-review") {
        action = "review";
      } else if (groupDecision === "match-existing") {
        action = row.existing ? "update" : "review";
      } else if (groupDecision === "keep-first") {
        action = groupIndex === 0 ? row.defaultAction : "skip";
      } else if (groupDecision === "keep-last") {
        action = groupIndex === lastIndex ? row.defaultAction : "skip";
      }
    }

    return {
      ...row,
      duplicateGroupSize,
      duplicateStatus,
      action,
    };
  });

  const summary = normalizedRows.reduce<ImportPreviewSummary>(
    (acc, row) => {
      acc.total += 1;
      acc.valid += row.validationIssues.length ? 0 : 1;
      acc.invalid += row.validationIssues.length ? 1 : 0;
      acc.inserts += row.action === "insert" ? 1 : 0;
      acc.updates += row.action === "update" ? 1 : 0;
      acc.skips += row.action === "skip" ? 1 : 0;
      acc.reviews += row.action === "review" ? 1 : 0;
      acc.exactMatches += row.duplicateStatus === "exact" ? 1 : 0;
      acc.fuzzyMatches += row.duplicateStatus === "fuzzy" ? 1 : 0;
      acc.internalDuplicates += row.duplicateStatus === "internal-duplicate" ? 1 : 0;
      return acc;
    },
    {
      total: 0,
      valid: 0,
      invalid: 0,
      inserts: 0,
      updates: 0,
      skips: 0,
      reviews: 0,
      exactMatches: 0,
      fuzzyMatches: 0,
      internalDuplicates: 0,
    }
  );

  return { rows: normalizedRows, summary };
}

const buildStudentPayload = (
  row: ImportPreviewRow,
  userId: string | null,
  rule: ImportTransferRule
): TablesInsert<"students"> | TablesUpdate<"students"> => {
  const firstName = row.mapped.firstName || splitFullName(row.mapped.fullName).firstName || "Imported";
  const lastName = row.mapped.lastName || splitFullName(row.mapped.fullName).lastName || null;
  const existing = row.existing;
  const importMeta = {
    rowKey: row.rowKey,
    identityKey: row.identityKey,
    rule,
    customValues: row.customValues,
  };

  const source = row.mapped;
  const base: TablesInsert<"students"> | TablesUpdate<"students"> = {
    admission_no: source.admissionNo || existing?.admission_no || "",
    first_name: firstName,
    last_name: lastName || null,
    dob: source.dob || null,
    gender: source.gender || null,
    blood_group: source.bloodGroup || null,
    nationality: source.nationality || "Indian",
    email: source.email || null,
    phone: source.phone || null,
    alternate_phone: source.alternatePhone || null,
    address: source.address || null,
    umis_id: source.umisId || null,
    emis_id: source.emisId || null,
    community: source.community || null,
    first_graduate: source.firstGraduate ? /^y|yes|true|1$/i.test(source.firstGraduate) : false,
    income_verification_status: (source.incomeVerified || "pending").toLowerCase() as TablesInsert<"students">["income_verification_status"],
    scholarship_notes: source.scholarshipNotes || null,
    fee_status: source.feeStatus || existing?.fee_status || "Pending",
    attendance_percent: source.attendancePercent ? Number(source.attendancePercent) : 0,
    status: (source.status || "active").toLowerCase() as TablesInsert<"students">["status"],
    meta: {
      import: importMeta,
      family: {
        fatherName: source.fatherName || null,
        fatherOccupation: source.fatherOccupation || null,
        motherName: source.motherName || null,
        motherOccupation: source.motherOccupation || null,
        guardianName: source.guardianName || source.fatherName || source.motherName || null,
        guardianOccupation: source.guardianOccupation || source.fatherOccupation || source.motherOccupation || null,
        guardianPhone: source.guardianPhone || source.phone || null,
        guardianEmail: source.guardianEmail || source.email || null,
        annualIncome: source.annualIncome || null,
      },
      academic: {
        academicYear: source.academicYear || null,
        grade: source.grade || null,
        section: source.section || null,
        roll: source.roll || null,
        stream: source.stream || null,
        house: source.house || null,
      },
    } as Json,
    updated_by: userId,
  };

  if (!existing) {
    return {
      ...base,
      created_by: userId,
      attendance_percent: source.attendancePercent ? Number(source.attendancePercent) : 0,
    };
  }

  return {
    admission_no: pickTextValue(source.admissionNo, existing.admission_no, rule) ?? existing.admission_no,
    first_name: source.firstName || splitFullName(source.fullName).firstName || existing.first_name,
    last_name: pickTextValue(source.lastName, existing.last_name, rule),
    dob: pickTextValue(source.dob, existing.dob, rule),
    gender: pickTextValue(source.gender, existing.gender, rule),
    blood_group: pickTextValue(source.bloodGroup, existing.blood_group, rule),
    nationality: pickTextValue(source.nationality, existing.nationality, rule) ?? existing.nationality ?? "Indian",
    email: pickTextValue(source.email, existing.email, rule),
    phone: pickTextValue(source.phone, existing.phone, rule),
    alternate_phone: pickTextValue(source.alternatePhone, existing.alternate_phone, rule),
    address: pickTextValue(source.address, existing.address, rule),
    umis_id: pickTextValue(source.umisId, existing.umis_id, rule),
    emis_id: pickTextValue(source.emisId, existing.emis_id, rule),
    community: pickTextValue(source.community, existing.community, rule),
    first_graduate: pickBooleanValue(source.firstGraduate, existing.first_graduate, rule),
    income_verification_status: (pickTextValue(source.incomeVerified, existing.income_verification_status, rule) || existing.income_verification_status || "pending").toLowerCase() as TablesUpdate<"students">["income_verification_status"],
    scholarship_notes: pickTextValue(source.scholarshipNotes, existing.scholarship_notes, rule),
    fee_status: pickTextValue(source.feeStatus, existing.fee_status, rule) || existing.fee_status,
    attendance_percent: pickNumberValue(source.attendancePercent, existing.attendance_percent, rule) ?? existing.attendance_percent,
    status: (pickTextValue(source.status, existing.status, rule) || existing.status || "active").toLowerCase() as TablesUpdate<"students">["status"],
    meta: {
      import: importMeta,
      family: {
        fatherName: source.fatherName || existing.guardian_name || null,
        fatherOccupation: source.fatherOccupation || existing.guardian_occupation || null,
        motherName: source.motherName || null,
        motherOccupation: source.motherOccupation || null,
        guardianName: source.guardianName || existing.guardian_name || source.fatherName || source.motherName || null,
        guardianOccupation: source.guardianOccupation || existing.guardian_occupation || source.fatherOccupation || source.motherOccupation || null,
        guardianPhone: source.guardianPhone || existing.guardian_phone || source.phone || null,
        guardianEmail: source.guardianEmail || existing.guardian_email || source.email || null,
        annualIncome: source.annualIncome || (existing.guardian_annual_income ? String(existing.guardian_annual_income) : null),
      },
      academic: {
        academicYear: source.academicYear || existing.academic_year || null,
        grade: source.grade || existing.grade || null,
        section: source.section || existing.section || null,
        roll: source.roll || (existing.roll_number != null ? String(existing.roll_number) : null),
        stream: source.stream || existing.stream || null,
        house: source.house || existing.house || null,
      },
    } as Json,
    updated_by: userId,
  } as TablesUpdate<"students">;
};

const buildEnrollmentPayload = (
  row: ImportPreviewRow,
  studentId: string,
  enrollmentId: string | null,
  rule: ImportTransferRule
): TablesInsert<"enrollments"> | TablesUpdate<"enrollments"> => {
  const source = row.mapped;
  const importMeta = {
    rowKey: row.rowKey,
    identityKey: row.identityKey,
    rule,
    customValues: row.customValues,
  };
  const base: TablesInsert<"enrollments"> | TablesUpdate<"enrollments"> = {
    student_id: studentId,
    academic_year_id: null,
    class_level_id: null,
    section_id: null,
    grade_label: source.grade || row.existing?.grade || null,
    section_label: source.section || row.existing?.section || null,
    stream: source.stream || row.existing?.stream || null,
    house: source.house || row.existing?.house || null,
    roll_number: source.roll ? Number(source.roll) : row.existing?.roll_number ?? null,
    status: (source.status || "active").toLowerCase() as TablesInsert<"enrollments">["status"],
    meta: {
      import: importMeta,
    } as Json,
  };

  if (!enrollmentId) return base as TablesInsert<"enrollments">;

  if (rule === "Update If Blank") {
    return {
      student_id: studentId,
      academic_year_id: null,
      class_level_id: null,
      section_id: null,
      grade_label: row.existing?.grade || source.grade || null,
      section_label: row.existing?.section || source.section || null,
      stream: row.existing?.stream || source.stream || null,
      house: row.existing?.house || source.house || null,
      roll_number: row.existing?.roll_number != null ? row.existing.roll_number : (source.roll ? Number(source.roll) : null),
      status: row.existing?.enrollment_status || (source.status || "active").toLowerCase(),
      meta: { import: importMeta } as Json,
    } as TablesUpdate<"enrollments">;
  }

  if (rule === "Overwrite Including Blanks") {
    return base as TablesUpdate<"enrollments">;
  }

  return {
    student_id: studentId,
    academic_year_id: null,
    class_level_id: null,
    section_id: null,
    grade_label: source.grade || row.existing?.grade || null,
    section_label: source.section || row.existing?.section || null,
    stream: source.stream || row.existing?.stream || null,
    house: source.house || row.existing?.house || null,
    roll_number: source.roll ? Number(source.roll) : (row.existing?.roll_number ?? null),
    status: (source.status || row.existing?.enrollment_status || "active").toLowerCase() as TablesUpdate<"enrollments">["status"],
    meta: { import: importMeta } as Json,
  } as TablesUpdate<"enrollments">;
};

export async function commitImportRows(
  rows: ImportPreviewRow[],
  options: {
    fileName: string;
    batchName: string;
    description?: string;
    rule: ImportTransferRule;
    design: ImportMatchDesign;
    threshold: number;
  }
): Promise<ImportCommitResult> {
  if (!(await tablesExist(["students", "enrollments"]))) {
    throw new Error("Student import is unavailable until the core student tables are installed.");
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

  for (const row of rows) {
    if (row.action === "skip" || row.action === "review" || row.validationIssues.length) {
      result.skipped += 1;
      continue;
    }

    try {
      if (row.action === "insert" || !row.existing) {
        const studentPayload = buildStudentPayload(row, userId, options.rule) as TablesInsert<"students">;
        const { data: student, error: studentError } = await supabase
          .from("students")
          .insert(studentPayload)
          .select("*")
          .single();
        if (studentError) throw studentError;

        const enrollmentPayload = buildEnrollmentPayload(row, student.id, null, options.rule) as TablesInsert<"enrollments">;
        const { error: enrollmentError } = await supabase.from("enrollments").insert(enrollmentPayload);
        if (enrollmentError) throw enrollmentError;

        if (await tableExists("audit_log")) {
          await supabase.from("audit_log").insert({
            actor: userId,
            action: "student.imported",
            entity: "students",
            entity_id: student.id,
            metadata: {
              fileName: options.fileName,
              batchName: options.batchName,
              description: options.description ?? null,
              rowKey: row.rowKey,
            },
          });
        }

      result.inserted += 1;
      continue;
      }

      const studentPayload = buildStudentPayload(row, userId, options.rule) as TablesUpdate<"students">;
      const { error: studentError } = await supabase.from("students").update(studentPayload).eq("id", row.existing.student_id);
      if (studentError) throw studentError;

      const enrollmentPayload = buildEnrollmentPayload(row, row.existing.student_id, row.existing.enrollment_id, options.rule);
      if (row.existing.enrollment_id) {
        const { error: enrollmentError } = await supabase
          .from("enrollments")
          .update(enrollmentPayload as TablesUpdate<"enrollments">)
          .eq("id", row.existing.enrollment_id);
        if (enrollmentError) throw enrollmentError;
      } else {
        const { error: enrollmentError } = await supabase
          .from("enrollments")
          .insert(enrollmentPayload as TablesInsert<"enrollments">);
        if (enrollmentError) throw enrollmentError;
      }

      if (await tableExists("audit_log")) {
        await supabase.from("audit_log").insert({
          actor: userId,
          action: "student.import.updated",
          entity: "students",
          entity_id: row.existing.student_id,
          metadata: {
            fileName: options.fileName,
            batchName: options.batchName,
            description: options.description ?? null,
            rowKey: row.rowKey,
          },
        });
      }

      result.updated += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        rowNumber: row.sourceRowIndex + 2,
        message: error instanceof Error ? error.message : "Unknown import error",
      });
    }
  }

  try {
    if (await tableExists("audit_log")) {
      await supabase.from("audit_log").insert({
        actor: userId,
        action: "student.import.batch.completed",
        entity: "students",
        metadata: {
          fileName: options.fileName,
          batchName: options.batchName,
          description: options.description ?? null,
          rule: options.rule,
          design: options.design,
          threshold: options.threshold,
          total: rows.length,
          inserted: result.inserted,
          updated: result.updated,
          skipped: result.skipped,
          failed: result.failed,
        },
      });
    }
  } catch {
    // The import has already completed; history logging is best-effort.
  }

  emitAppSync(studentRegisterSyncKey);

  return result;
}

export async function loadImportBatchHistory(limit = 10): Promise<ImportBatchHistoryEntry[]> {
  if (!(await tableExists("audit_log"))) return [];
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, created_at, metadata")
    .eq("action", "student.import.batch.completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((entry) => {
    const metadata = (entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata) ? entry.metadata : {}) as Record<string, unknown>;
    return {
      id: String(entry.id),
      batchName: String(metadata.batchName ?? "Unnamed batch"),
      fileName: String(metadata.fileName ?? "Unknown file"),
      description: typeof metadata.description === "string" ? metadata.description : null,
      rule: String(metadata.rule ?? "Update If Blank") as ImportTransferRule,
      design: String(metadata.design ?? "reg_umis_emis") as ImportMatchDesign,
      threshold: Number.isFinite(Number(metadata.threshold)) ? Number(metadata.threshold) : 88,
      total: Number(metadata.total ?? 0),
      inserted: Number(metadata.inserted ?? 0),
      updated: Number(metadata.updated ?? 0),
      skipped: Number(metadata.skipped ?? 0),
      failed: Number(metadata.failed ?? 0),
      createdAt: entry.created_at,
    };
  });
}
