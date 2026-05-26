import type { RegistryFieldConfig } from "@/lib/registry-groups";

export const REGISTRY_AI_STORAGE_KEY = "sms.registry-ai-state.v1";

export interface RegistryMatchScore {
  score: number;
  reasons: string[];
}

export interface ReviewSuggestion {
  field: RegistryFieldConfig;
  score: number;
}

export interface ReviewQueueItem {
  type: "unmapped" | "low-confidence" | "conflict";
  detectedHeader: string;
  confidence: number;
  suggestions: ReviewSuggestion[];
}

export interface RegistryAiDiagnostics {
  conflicts: number;
  lowConfidence: number;
  unmapped: number;
}

export interface RegistryAiState {
  enabled: boolean;
  autoSuggest: boolean;
  autoLearn: boolean;
  minimumScore: number;
  approvedMappings: Record<string, string>;
  rejectedMappings: Record<string, string[]>;
  learnedAliases: Record<string, string[]>;
  reviewQueue: ReviewQueueItem[];
  suggestionsByHeader: Record<string, ReviewSuggestion[]>;
  explanationsByHeader: Record<string, string[]>;
  diagnostics: RegistryAiDiagnostics;
}

export function createDefaultAiState(): RegistryAiState {
  return {
    enabled: true,
    autoSuggest: true,
    autoLearn: false,
    minimumScore: 40,
    approvedMappings: {},
    rejectedMappings: {},
    learnedAliases: {},
    reviewQueue: [],
    suggestionsByHeader: {},
    explanationsByHeader: {},
    diagnostics: { conflicts: 0, lowConfidence: 0, unmapped: 0 },
  };
}

export function loadRegistryAiState(): RegistryAiState {
  if (typeof window === "undefined") return createDefaultAiState();
  try {
    const raw = localStorage.getItem(REGISTRY_AI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RegistryAiState>;
      return { ...createDefaultAiState(), ...parsed };
    }
  } catch {}
  return createDefaultAiState();
}

export function saveRegistryAiState(state: RegistryAiState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REGISTRY_AI_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function normalizeRegistryToken(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeRegistryValue(value: string): string[] {
  return normalizeRegistryToken(value)
    .split(/\s+/)
    .filter(Boolean);
}

export function computeRegistryMatchScore(
  detectedHeader: string,
  canonicalField: RegistryFieldConfig,
  state: RegistryAiState,
): RegistryMatchScore {
  const reasons: string[] = [];
  const detected = normalizeRegistryToken(detectedHeader);
  const key = normalizeRegistryToken(canonicalField.key);
  const label = normalizeRegistryToken(canonicalField.label);
  const aliases = (canonicalField.aliases ?? []).map(a => normalizeRegistryToken(a));
  const learnedAliases = (state.learnedAliases[detected] ?? []).map(a => normalizeRegistryToken(a));

  /* ── previously approved mapping ── */
  const approved = state.approvedMappings[detected];
  if (approved === canonicalField.key) {
    return { score: 100, reasons: ["Previously approved mapping"] };
  }

  /* ── previously rejected ── */
  const rejected = state.rejectedMappings[detected] ?? [];
  const wasRejected = rejected.some(r => normalizeRegistryToken(r) === key);
  if (wasRejected) {
    return { score: -80, reasons: ["Previously rejected mapping"] };
  }

  /* ── exact matches ── */
  if (detected === key) {
    reasons.push("Exact canonical key match");
    return { score: 100, reasons };
  }
  if (detected === label) {
    reasons.push("Exact label match");
    return { score: 95, reasons };
  }
  const learnedMatch = learnedAliases.some(a => a === detected || a === key);
  if (learnedMatch) {
    reasons.push("Exact learned alias match");
    return { score: 88, reasons };
  }
  const exactAlias = aliases.find(a => a === detected);
  if (exactAlias) {
    reasons.push(`Exact alias match: ${exactAlias}`);
    return { score: 85, reasons };
  }

  /* ── token overlap scoring ── */
  const detectedTokens = tokenizeRegistryValue(detectedHeader);
  const fieldTokens = tokenizeRegistryValue(canonicalField.key + " " + canonicalField.label);
  for (const alias of aliases) {
    fieldTokens.push(...tokenizeRegistryValue(alias));
  }

  if (detectedTokens.length === 0) {
    return { score: 0, reasons: ["Empty detected header"] };
  }

  const shared = detectedTokens.filter(t => fieldTokens.includes(t));
  const overlapRatio = shared.length / detectedTokens.length;

  if (overlapRatio >= 0.8) {
    reasons.push(`High token overlap (${Math.round(overlapRatio * 100)}%)`);
    return { score: 75 + Math.round(overlapRatio * 10), reasons };
  }
  if (overlapRatio >= 0.4) {
    reasons.push(`Partial token overlap (${Math.round(overlapRatio * 100)}%)`);
    return { score: 40 + Math.round(overlapRatio * 30), reasons };
  }
  if (overlapRatio > 0) {
    reasons.push(`Low token overlap (${Math.round(overlapRatio * 100)}%)`);
    return { score: 10 + Math.round(overlapRatio * 20), reasons };
  }

  /* ── partial substring match (fallback) ── */
  const keyContains = key.includes(detected) || detected.includes(key);
  const labelContains = label.includes(detected) || detected.includes(label);
  if (keyContains || labelContains) {
    reasons.push("Partial substring match");
    return { score: 30, reasons };
  }

  reasons.push("No significant match");
  return { score: 0, reasons };
}

export function getRegistryCanonicalSuggestions(
  detectedHeader: string,
  canonicalFields: RegistryFieldConfig[],
  state: RegistryAiState,
): ReviewSuggestion[] {
  const scored = canonicalFields.map(f => ({
    field: f,
    score: computeRegistryMatchScore(detectedHeader, f, state).score,
  }));
  const filtered = scored.filter(s => s.score >= state.minimumScore);
  filtered.sort((a, b) => b.score - a.score);
  return filtered.slice(0, 5);
}

export function rebuildRegistryAiReviewQueue(
  detectedHeaders: string[],
  canonicalFields: RegistryFieldConfig[],
  state: RegistryAiState,
): RegistryAiState {
  const queue: ReviewQueueItem[] = [];
  const suggestionsByHeader: Record<string, ReviewSuggestion[]> = {};
  const explanationsByHeader: Record<string, string[]> = {};
  const diagnostics: RegistryAiDiagnostics = { conflicts: 0, lowConfidence: 0, unmapped: 0 };

  for (const header of detectedHeaders) {
    const suggestions = getRegistryCanonicalSuggestions(header, canonicalFields, state);
    suggestionsByHeader[header] = suggestions;
    explanationsByHeader[header] = suggestions.map(s => computeRegistryMatchScore(header, s.field, state).reasons.join("; "));

    if (suggestions.length === 0) {
      diagnostics.unmapped++;
      queue.push({ type: "unmapped", detectedHeader: header, confidence: 0, suggestions: [] });
      continue;
    }

    const top = suggestions[0];
    const second = suggestions[1];

    if (top.score < 55) {
      diagnostics.lowConfidence++;
      queue.push({ type: "low-confidence", detectedHeader: header, confidence: top.score, suggestions });
    } else if (second && Math.abs(top.score - second.score) < 8) {
      diagnostics.conflicts++;
      queue.push({ type: "conflict", detectedHeader: header, confidence: top.score, suggestions });
    } else {
      queue.push({ type: "conflict", detectedHeader: header, confidence: top.score, suggestions: [top] });
    }
  }

  return {
    ...state,
    reviewQueue: queue,
    suggestionsByHeader,
    explanationsByHeader,
    diagnostics,
  };
}

export function approveRegistryAiMapping(
  header: string,
  fieldKey: string,
  state: RegistryAiState,
): RegistryAiState {
  const detected = normalizeRegistryToken(header);
  const approvedMappings = { ...state.approvedMappings, [detected]: fieldKey };

  const learnedAliases = { ...state.learnedAliases };
  const existing = learnedAliases[detected] ?? [];
  if (!existing.includes(fieldKey)) {
    learnedAliases[detected] = [...existing, fieldKey];
  }

  const rejectedMappings = { ...state.rejectedMappings };
  for (const key of Object.keys(rejectedMappings)) {
    if (normalizeRegistryToken(key) === detected) {
      const filtered = (rejectedMappings[key] ?? []).filter(r => r !== fieldKey);
      if (filtered.length) rejectedMappings[key] = filtered;
      else delete rejectedMappings[key];
    }
  }

  return { ...state, approvedMappings, rejectedMappings, learnedAliases };
}

export function rejectRegistryAiMapping(
  header: string,
  fieldKey: string,
  state: RegistryAiState,
): RegistryAiState {
  const detected = normalizeRegistryToken(header);
  const existing = state.rejectedMappings[detected] ?? [];
  if (existing.includes(fieldKey)) return state;

  return {
    ...state,
    rejectedMappings: {
      ...state.rejectedMappings,
      [detected]: [...existing, fieldKey],
    },
  };
}

export function getRegistryAiStatusLabel(state: RegistryAiState): { text: string; className: string } {
  if (!state.enabled) return { text: "Disabled", className: "registry-ai-status" };
  if (state.autoLearn && Object.keys(state.learnedAliases).length > 0) {
    return { text: `Learning ${Object.keys(state.learnedAliases).length}`, className: "registry-ai-status learning" };
  }
  if (state.reviewQueue.length > 0) {
    return { text: `${state.reviewQueue.length} pending`, className: "registry-ai-status has-items" };
  }
  return { text: "Ready", className: "registry-ai-status" };
}
