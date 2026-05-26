import type { ImportMappingLine, ImportTransferMode, ImportMatchStrategy } from "./types";
import { CANONICAL_FIELDS } from '../../engine/registry/canonical';

interface ResolvedMatch {
  importField: string;
  targetField: string | null;
  transferMode: ImportTransferMode;
  isRequired: boolean;
}

const MAPPING_RULES: Record<string, string> = {
  "first name": "firstName",
  fname: "firstName",
  firstname: "firstName",
  "last name": "lastName",
  lname: "lastName",
  lastname: "lastName",
  email: "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  "date of birth": "dateOfBirth",
  dob: "dateOfBirth",
  gender: "gender",
  address: "address",
  enrollment: "enrollmentNumber",
  "enrollment number": "enrollmentNumber",
  "enrollment no": "enrollmentNumber",
  "roll no": "rollNumber",
  "roll number": "rollNumber",
  class: "grade",
  section: "section",
  division: "section",
  institute: "institute",
};

function buildRegistryAliasIndex(): Map<string, string> {
  const idx = new Map<string, string>();
  for (const field of CANONICAL_FIELDS) {
    idx.set(field.key.toLowerCase(), field.key);
    idx.set(field.label.toLowerCase(), field.key);
    for (const alias of field.aliases) {
      idx.set(alias.toLowerCase(), field.key);
    }
  }
  return idx;
}

export function invalidateRegistryAliasIndex(): void {
  /* no-op; kept for compatibility */
}

function resolveFromRegistry(headerLower: string): string | null {
  const idx = buildRegistryAliasIndex();
  const direct = idx.get(headerLower);
  if (direct) return direct;

  const fuzzy = headerLower.replace(/[_\s-]+/g, '');
  for (const [key, val] of idx.entries()) {
    if (key.replace(/[_\s-]+/g, '') === fuzzy) return val;
  }
  return null;
}

export function resolveImportMappingEngineMatch(
  sourceHeader: string,
  defaultImportType: ImportTransferMode = "newentry",
  _options: { matchStrategy?: ImportMatchStrategy } = {},
): ResolvedMatch {
  if (!sourceHeader) {
    return {
      importField: "",
      targetField: null,
      transferMode: defaultImportType,
      isRequired: false,
    };
  }

  const headerLower = String(sourceHeader).toLowerCase().trim();

  // 1. Try hardcoded rules first (fast path)
  let targetField = MAPPING_RULES[headerLower] || null;

  // 2. Try registry alias match
  if (!targetField) {
    targetField = resolveFromRegistry(headerLower);
  }

  // 3. Determine required from CanonicalFields
  const canonicalField = CANONICAL_FIELDS.find((f) => f.key === targetField);
  const isRequired = canonicalField?.required ?? ["firstName", "lastName", "email"].includes(targetField || "");

  return {
    importField: sourceHeader,
    targetField,
    transferMode: defaultImportType,
    isRequired,
  };
}

export function buildDefaultImportMapping(
  headers: string[],
  defaultType: ImportTransferMode,
  _options: { matchStrategy?: ImportMatchStrategy } = {},
): ImportMappingLine[] {
  if (!Array.isArray(headers) || headers.length === 0) {
    return [];
  }

  return headers.map((importField) => {
    const targetField = resolveImportMappingEngineMatch(
      importField,
      defaultType,
      _options,
    );

    return {
      importField,
      targetField: targetField?.targetField || null,
      transferMode: targetField?.transferMode || defaultType,
      isRequired: targetField?.isRequired || false,
    };
  });
}

export function applyCustomMapping(
  baseMapping: ImportMappingLine[],
  overrides: Record<string, ImportMappingLine>,
): ImportMappingLine[] {
  return baseMapping.map((line) => {
    if (overrides[line.importField]) {
      return { ...line, ...overrides[line.importField] };
    }
    return line;
  });
}

export function autoDetectMapping(
  headers: string[],
  defaultType: ImportTransferMode,
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const result = resolveImportMappingEngineMatch(header, defaultType);
    mapping[header] = result.targetField || "ignore";
  }
  return mapping;
}
