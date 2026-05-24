export const PARITY_STATUSES = ["missing", "partial", "matched", "verified", "retired"] as const;

export type ParityStatus = (typeof PARITY_STATUSES)[number];

export interface ParityRecord {
  featureKey: string;
  legacyModule: string;
  newModule: string;
  status: ParityStatus;
  evidence?: string;
  notes?: string;
  lastCheckedAt: string;
}

export interface MigrationCutoverControlRow {
  tenantId: string;
  dualRunEnabled: boolean;
  newSystemPrimary: boolean;
  legacyFallbackEnabled: boolean;
  migrationFrozen: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

export interface CutoverState {
  tenantId: string;
  dualRunEnabled: boolean;
  newSystemPrimary: boolean;
  legacyFallbackEnabled: boolean;
  migrationFrozen: boolean;
  completedFeatures: number;
  totalFeatures: number;
  updatedAt: string;
}

export interface ParityMatrixSummary {
  totalFeatures: number;
  completedFeatures: number;
  verifiedFeatures: number;
  retiredFeatures: number;
  matchedFeatures: number;
  partialFeatures: number;
  missingFeatures: number;
  evidenceCovered: number;
  blockerCount: number;
  completionRate: number;
  readyForCutover: boolean;
  blockers: string[];
  lastCheckedAt: string | null;
}

export interface ParityAuditSummary {
  entries: number;
  lastAuditAt: string | null;
}

export interface ParityMatrixSnapshot {
  rows: ParityRecord[];
  summary: ParityMatrixSummary;
  audit: ParityAuditSummary;
}

export interface CutoverChecklistItem {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface CutoverSnapshot {
  state: CutoverState;
  controls: MigrationCutoverControlRow | null;
  summary: ParityMatrixSummary;
  checklist: CutoverChecklistItem[];
  blockers: string[];
  canPromote: boolean;
  canRetireLegacyPaths: boolean;
}

const STATUS_SET = new Set<ParityStatus>(PARITY_STATUSES);

const toTrimmedString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const hasEvidence = (value: string | undefined) => toTrimmedString(value).length > 0;

const toTimestamp = (value: string | null | undefined) => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : value;
};

export function parseParityStatus(value: unknown): ParityStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!STATUS_SET.has(normalized as ParityStatus)) return null;
  return normalized as ParityStatus;
}

export function normalizeParityStatus(value: unknown, fallback: ParityStatus = "missing"): ParityStatus {
  return parseParityStatus(value) ?? fallback;
}

export function coerceOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return undefined;
}

export function buildParitySummary(rows: ParityRecord[]): ParityMatrixSummary {
  const counts: Record<ParityStatus, number> = {
    missing: 0,
    partial: 0,
    matched: 0,
    verified: 0,
    retired: 0,
  };

  let evidenceCovered = 0;
  let lastCheckedAt: string | null = null;
  const blockers: string[] = [];

  for (const row of rows) {
    const status = normalizeParityStatus(row.status);
    counts[status] += 1;
    if (status === "verified" || status === "retired") {
      if (hasEvidence(row.evidence)) evidenceCovered += 1;
    }
    if (status === "missing" || status === "partial" || status === "matched") {
      blockers.push(`${row.featureKey}: ${status}`);
    }

    const checkedAt = toTimestamp(row.lastCheckedAt);
    if (checkedAt && (!lastCheckedAt || Date.parse(checkedAt) > Date.parse(lastCheckedAt))) {
      lastCheckedAt = checkedAt;
    }
  }

  const totalFeatures = rows.length;
  const completedFeatures = counts.verified + counts.retired;
  const blockerCount = counts.missing + counts.partial + counts.matched;
  const completionRate = totalFeatures > 0 ? completedFeatures / totalFeatures : 0;

  return {
    totalFeatures,
    completedFeatures,
    verifiedFeatures: counts.verified,
    retiredFeatures: counts.retired,
    matchedFeatures: counts.matched,
    partialFeatures: counts.partial,
    missingFeatures: counts.missing,
    evidenceCovered,
    blockerCount,
    completionRate,
    readyForCutover:
      totalFeatures > 0 &&
      blockerCount === 0 &&
      completedFeatures === totalFeatures &&
      evidenceCovered === completedFeatures,
    blockers,
    lastCheckedAt,
  };
}

export function buildCutoverState(
  tenantId: string,
  summary: ParityMatrixSummary,
  controls: MigrationCutoverControlRow | null,
): CutoverState {
  return {
    tenantId,
    dualRunEnabled: controls?.dualRunEnabled ?? true,
    newSystemPrimary: controls?.newSystemPrimary ?? false,
    legacyFallbackEnabled: controls?.legacyFallbackEnabled ?? true,
    migrationFrozen: controls?.migrationFrozen ?? false,
    completedFeatures: summary.completedFeatures,
    totalFeatures: summary.totalFeatures,
    updatedAt: controls?.updatedAt ?? new Date().toISOString(),
  };
}

export function evaluateCutoverReadiness(summary: ParityMatrixSummary, state: Pick<CutoverState, "dualRunEnabled" | "newSystemPrimary" | "legacyFallbackEnabled" | "migrationFrozen">) {
  const reasons: string[] = [];

  if (state.newSystemPrimary) {
    if (!state.dualRunEnabled) {
      reasons.push("Dual-run must stay enabled while the new system is primary.");
    }
    if (!state.legacyFallbackEnabled) {
      reasons.push("Legacy fallback must remain available until retirement is complete.");
    }
    if (!state.migrationFrozen) {
      reasons.push("Migration freeze approval is required before cutover.");
    }
    if (!summary.readyForCutover) {
      reasons.push("Every tracked feature must be verified or retired with evidence.");
    }
    if (summary.blockerCount > 0) {
      reasons.push("Resolve parity blockers before promoting the new system.");
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

export function buildCutoverSnapshot(
  tenantId: string,
  summary: ParityMatrixSummary,
  controls: MigrationCutoverControlRow | null,
): CutoverSnapshot {
  const state = buildCutoverState(tenantId, summary, controls);
  const readiness = evaluateCutoverReadiness(summary, state);

  return {
    state,
    controls,
    summary,
    checklist: [
      {
        key: "parity-coverage",
        label: "Parity coverage tracked",
        passed: summary.totalFeatures > 0 && summary.blockerCount === 0,
        detail: summary.totalFeatures > 0
          ? `${summary.completedFeatures}/${summary.totalFeatures} features verified or retired.`
          : "No parity records have been loaded yet.",
      },
      {
        key: "evidence",
        label: "Evidence recorded",
        passed: summary.completedFeatures > 0 && summary.evidenceCovered === summary.completedFeatures,
        detail: `${summary.evidenceCovered}/${summary.completedFeatures} completed features have evidence attached.`,
      },
      {
        key: "dual-run",
        label: "Dual-run active",
        passed: state.dualRunEnabled,
        detail: state.dualRunEnabled ? "Legacy and new paths can be compared side by side." : "Dual-run is paused.",
      },
      {
        key: "fallback",
        label: "Legacy fallback enabled",
        passed: state.legacyFallbackEnabled,
        detail: state.legacyFallbackEnabled ? "Rollback remains available during the freeze window." : "Fallback is disabled.",
      },
      {
        key: "freeze",
        label: "Migration freeze approved",
        passed: state.migrationFrozen,
        detail: state.migrationFrozen ? "Promotion changes are now frozen." : "Freeze approval is still pending.",
      },
      {
        key: "primary",
        label: "New system primary",
        passed: state.newSystemPrimary,
        detail: state.newSystemPrimary ? "Traffic should favor the new system." : "Primary traffic still routes through the legacy path.",
      },
    ],
    blockers: readiness.reasons,
    canPromote: readiness.allowed,
    canRetireLegacyPaths:
      state.newSystemPrimary &&
      state.dualRunEnabled &&
      state.legacyFallbackEnabled &&
      state.migrationFrozen &&
      summary.readyForCutover,
  };
}
