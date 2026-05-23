import type { ImportModuleFieldGroup } from "./types";
import { getModule } from "./module-registry";

export interface ImportSchemaDriftEntry {
  header: string;
  issue: "unrecognized" | "low_confidence" | "missing";
  suggestedField?: string;
  confidence: number;
  detail: string;
}

export interface ImportSchemaDriftReport {
  moduleId: string;
  totalHeaders: number;
  matchedHeaders: number;
  unrecognized: ImportSchemaDriftEntry[];
  lowConfidence: ImportSchemaDriftEntry[];
  missingRequired: ImportSchemaDriftEntry[];
  hasDrift: boolean;
  summary: string;
}

function normalizedSimilarity(a: string, b: string): number {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.8;
  const longer = la.length >= lb.length ? la : lb;
  const shorter = la.length < lb.length ? la : lb;
  const matches = [...shorter].filter((ch, i) => ch === longer[i]).length;
  return matches / longer.length;
}

function getFieldByKeyOrAlias(
  header: string,
  fieldGroups: ImportModuleFieldGroup[],
): { field: ImportModuleFieldGroup["fields"][number]; confidence: number } | null {
  const h = header.toLowerCase().trim();
  for (const group of fieldGroups) {
    for (const field of group.fields) {
      const allKeys = [field.key, field.label, ...field.aliases].map((s) => s.toLowerCase().trim());
      const exact = allKeys.find((k) => k === h);
      if (exact) return { field, confidence: 1 };
      const aliasMatch = allKeys.find((k) => k === h || h.includes(k) || k.includes(h));
      if (aliasMatch) return { field, confidence: 0.9 };
      const fuzzy = allKeys
        .map((k) => ({ k, score: normalizedSimilarity(k, h) }))
        .sort((a, b) => b.score - a.score)[0];
      if (fuzzy && fuzzy.score >= 0.5) return { field, confidence: fuzzy.score };
    }
  }
  return null;
}

export function getImportSchemaDriftReport(
  moduleId: string,
  headers: string[],
): ImportSchemaDriftReport {
  const mod = getModule(moduleId);
  if (!mod) {
    return {
      moduleId,
      totalHeaders: headers.length,
      matchedHeaders: 0,
      unrecognized: [],
      lowConfidence: [],
      missingRequired: [],
      hasDrift: true,
      summary: `Module "${moduleId}" not found.`,
    };
  }

  const { fieldGroups } = mod;
  const matched = new Set<string>();
  const unrecognized: ImportSchemaDriftEntry[] = [];
  const lowConfidence: ImportSchemaDriftEntry[] = [];

  for (const header of headers) {
    const match = getFieldByKeyOrAlias(header, fieldGroups);
    if (!match) {
      const closest = fieldGroups
        .flatMap((g) => g.fields)
        .map((f) => ({
          field: f,
          score: Math.max(
            normalizedSimilarity(header, f.key),
            ...f.aliases.map((a) => normalizedSimilarity(header, a)),
          ),
        }))
        .sort((a, b) => b.score - a.score)[0];

      unrecognized.push({
        header,
        issue: "unrecognized",
        suggestedField: closest && closest.score >= 0.3 ? closest.field.key : undefined,
        confidence: closest?.score ?? 0,
        detail: closest && closest.score >= 0.3
          ? `No match found. Did you mean "${closest.field.label}"?`
          : "No matching field found in the schema.",
      });
    } else if (match.confidence < 1) {
      matched.add(match.field.key);
      lowConfidence.push({
        header,
        issue: "low_confidence",
        suggestedField: match.field.key,
        confidence: match.confidence,
        detail: `Weak match: "${header}" → ${match.field.label} (${Math.round(match.confidence * 100)}% confidence)`,
      });
    } else {
      matched.add(match.field.key);
    }
  }

  const missingRequired: ImportSchemaDriftEntry[] = [];
  for (const group of fieldGroups) {
    for (const field of group.fields) {
      if (field.required && !matched.has(field.key)) {
        missingRequired.push({
          header: "",
          issue: "missing",
          suggestedField: field.key,
          confidence: 0,
          detail: `Required field "${field.label}" is missing from the import file.`,
        });
      }
    }
  }

  const totalIssues = unrecognized.length + lowConfidence.length + missingRequired.length;
  const hasDrift = totalIssues > 0;

  let summary: string;
  if (hasDrift) {
    const parts: string[] = [];
    if (unrecognized.length) parts.push(`${unrecognized.length} unrecognized header(s)`);
    if (lowConfidence.length) parts.push(`${lowConfidence.length} low-confidence match(es)`);
    if (missingRequired.length) parts.push(`${missingRequired.length} required field(s) missing`);
    summary = `Schema drift detected: ${parts.join(", ")}.`;
  } else {
    summary = "All headers match the expected schema.";
  }

  return {
    moduleId,
    totalHeaders: headers.length,
    matchedHeaders: matched.size,
    unrecognized,
    lowConfidence,
    missingRequired,
    hasDrift,
    summary,
  };
}
