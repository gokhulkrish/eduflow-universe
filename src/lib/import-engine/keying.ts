import type {
  ImportBatch,
  ImportKeyingConfig,
  ImportMatchStrategy,
  ImportResolvedAction,
} from "./types";
import { normalizeKey, normalizeLoose, normalizeDate, similarity as fuzzySimilarity } from "./core";

export interface ExistingStudentRecord {
  student_id: string;
  enrollment_id: string | null;
  admission_no: string;
  first_name: string;
  last_name: string | null;
  display_name: string;
  dob: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  umis_id: string | null;
  emis_id: string | null;
  grade: string | null;
  section: string | null;
  roll_number: number | null;
  stream: string | null;
  status: string;
  [key: string]: unknown;
}

export function getBatchKeyingConfig(
  batch: ImportBatch,
): ImportKeyingConfig {
  return {
    enabled: batch.keyingConfig?.enabled ?? true,
    importKey: batch.keyingConfig?.importKey || [],
    duplicateKey: batch.keyingConfig?.duplicateKey || [],
    sourceFields: batch.keyingConfig?.sourceFields || [],
  };
}

export function updateImportKeyConfig(
  batch: ImportBatch,
  newConfig: Partial<ImportKeyingConfig>,
): void {
  batch.keyingConfig = {
    ...batch.keyingConfig,
    ...newConfig,
  };
}

export function buildIdentityKey(
  row: Record<string, string>,
  design: ImportMatchStrategy,
): string {
  const admission = normalizeKey(row.admissionNo || row.admission_no || "");
  const umis = normalizeKey(row.umisId || row.umis_id || "");
  const emis = normalizeKey(row.emisId || row.emis_id || "");
  const name = normalizeKey(
    [row.firstName || row.first_name, row.lastName || row.last_name]
      .filter(Boolean)
      .join(" ") || row.fullName || row.display_name || "",
  );
  const dob = normalizeKey(row.dob || row.dateOfBirth || "");

  switch (design) {
    case "registration_only":
      return admission
        ? `reg:${admission}`
        : `name:${name}|dob:${dob}`;
    case "umis_only":
      return umis
        ? `umis:${umis}`
        : emis
          ? `emis:${emis}`
          : admission
            ? `reg:${admission}`
            : `name:${name}|dob:${dob}`;
    case "name_dob":
    case "fuzzy_name_dob":
      return name && dob
        ? `name:${name}|dob:${dob}`
        : admission
          ? `reg:${admission}`
          : `name:${name}|dob:${dob}`;
    case "reg_or_name_dob":
      return admission
        ? `reg:${admission}`
        : name && dob
          ? `name:${name}|dob:${dob}`
          : umis
            ? `umis:${umis}`
            : emis
              ? `emis:${emis}`
              : `name:${name}|dob:${dob}`;
    default:
      return admission
        ? `reg:${admission}`
        : umis
          ? `umis:${umis}`
          : emis
            ? `emis:${emis}`
            : name && dob
              ? `name:${name}|dob:${dob}`
              : `name:${name}`;
  }
}

export function getExistingMatch(
  row: Record<string, string>,
  existingRows: ExistingStudentRecord[],
  design: ImportMatchStrategy,
  threshold: number,
): { row: ExistingStudentRecord; score: number; reason: string } | null {
  let best: { row: ExistingStudentRecord; score: number; reason: string } | null = null;

  for (const existing of existingRows) {
    const admission = normalizeKey(row.admissionNo || row.admission_no || "");
    const umis = normalizeKey(row.umisId || row.umis_id || "");
    const emis = normalizeKey(row.emisId || row.emis_id || "");
    const existingAdmission = normalizeKey(existing.admission_no);
    const existingUmis = normalizeKey(existing.umis_id ?? "");
    const existingEmis = normalizeKey(existing.emis_id ?? "");
    const name = normalizeLoose(
      [row.firstName || row.first_name, row.lastName || row.last_name]
        .filter(Boolean)
        .join(" ") || row.fullName || "",
    );
    const existingName = normalizeLoose(existing.display_name);
    const dob = normalizeDate(row.dob || row.dateOfBirth || "");
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
      const nameScore = fuzzySimilarity(name, existingName);
      const dobScore = dob && existingDob && dob === existingDob ? 1 : 0;
      score = Math.round(nameScore * 80 + dobScore * 20);
      if (score >= 60) reason = `Fuzzy name + DOB match (${score}%)`;
    } else {
      const regScore = admission && admission === existingAdmission ? 100 : 0;
      const umisScore = umis && umis === existingUmis ? 99 : 0;
      const emisScore = emis && emis === existingEmis ? 98 : 0;
      const nameScore = fuzzySimilarity(name, existingName);
      const dobScore = dob && existingDob && dob === existingDob ? 1 : 0;
      score = Math.max(
        regScore,
        umisScore,
        emisScore,
        Math.round(nameScore * 80 + dobScore * 20),
      );
      if (score === regScore && regScore) reason = "Admission number matched";
      else if (score === umisScore && umisScore) reason = "UMIS matched";
      else if (score === emisScore && emisScore) reason = "EMIS matched";
      else if (score >= 60) reason = `Name + DOB similarity ${score}%`;
    }

    if (!score) continue;
    if (score < threshold * 100) continue;
    if (!best || score > best.score)
      best = { row: existing, score, reason: reason || "Potential match" };
  }

  return best;
}

export function getFuzzyImportMatchCandidates(
  row: Record<string, string>,
  existingRecords: ExistingStudentRecord[],
  options: { threshold?: number } = {},
): { student: ExistingStudentRecord; similarity: number; matchCount: number }[] {
  if (!existingRecords || !row) {
    return [];
  }

  const threshold = options.threshold || 0.7;
  const candidates: {
    student: ExistingStudentRecord;
    similarity: number;
    matchCount: number;
  }[] = [];

  const searchTerms = [
    row.firstName || row.first_name,
    row.lastName || row.last_name,
    row.email,
    row.phone,
  ]
    .filter(Boolean)
    .map((t) => String(t).toLowerCase());

  existingRecords.forEach((student) => {
    const studentTerms = [
      student.first_name,
      student.last_name,
      student.email,
      student.phone,
    ]
      .filter(Boolean)
      .map((t) => String(t).toLowerCase());

    let matches = 0;
    searchTerms.forEach((term) => {
      if (
        studentTerms.some(
          (sTerm) => sTerm.includes(term) || term.includes(sTerm),
        )
      ) {
        matches++;
      }
    });

    const similarity =
      matches / Math.max(searchTerms.length, studentTerms.length);

    if (similarity >= threshold) {
      candidates.push({
        student,
        similarity,
        matchCount: matches,
      });
    }
  });

  return candidates.sort((a, b) => b.similarity - a.similarity);
}

export function detectDuplicateConflicts(
  rows: Record<string, string>[],
  existingRecords: ExistingStudentRecord[],
  duplicateMatchConfig: ImportKeyingConfig | null = null,
  _options: { verbose?: boolean } = {},
): Record<string, { duplicates: Record<string, string>[]; existing: ExistingStudentRecord | null }> {
  const conflicts: Record<
    string,
    {
      duplicates: Record<string, string>[];
      existing: ExistingStudentRecord | null;
    }
  > = {};

  for (const row of rows) {
    const email = normalizeKey(row.email || "");
    const phone = normalizeKey(row.phone || "");

    if (!email && !phone) continue;

    const key = email ? `email:${email}` : `phone:${phone}`;

    if (!conflicts[key]) {
      conflicts[key] = { duplicates: [], existing: null };

      const match = getExistingMatch(row, existingRecords, "reg_umis_emis", 0.6);
      if (match) {
        conflicts[key].existing = match.row;
      }
    }

    conflicts[key].duplicates.push(row);
  }

  return conflicts;
}

export function inferImportType(
  row: Record<string, string>,
  batchDefaultType: string,
  existing: ExistingStudentRecord | null,
  _options: Record<string, unknown> = {},
): ImportResolvedAction {
  if (!existing) {
    return "insert";
  }

  if (batchDefaultType === "update") {
    return "update";
  }

  if (batchDefaultType === "upsert") {
    return "update";
  }

  if (batchDefaultType === "newentry") {
    return "skip";
  }

  return "insert";
}
