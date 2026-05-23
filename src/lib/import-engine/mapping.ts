import type { ImportMappingLine, ImportTransferMode, ImportMatchStrategy } from "./types";

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
  class: "class",
  section: "division",
  division: "division",
  institute: "institute",
};

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
  const targetField = MAPPING_RULES[headerLower] || null;

  return {
    importField: sourceHeader,
    targetField,
    transferMode: defaultImportType,
    isRequired: ["firstName", "lastName", "email"].includes(targetField || ""),
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
