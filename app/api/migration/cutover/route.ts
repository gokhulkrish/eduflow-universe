import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/db/pool";
import {
  buildCutoverSnapshot,
  buildParitySummary,
  coerceOptionalBoolean,
  evaluateCutoverReadiness,
  type MigrationCutoverControlRow,
  type ParityRecord,
  parseParityStatus,
} from "@/lib/migration-controls";

function toParityRecord(row: Record<string, unknown>): ParityRecord {
  return {
    featureKey: String(row.feature_key ?? ""),
    legacyModule: String(row.legacy_module ?? ""),
    newModule: String(row.new_module ?? ""),
    status: parseParityStatus(row.status) ?? "missing",
    evidence: typeof row.evidence === "string" && row.evidence.trim().length > 0 ? row.evidence.trim() : undefined,
    notes: typeof row.notes === "string" && row.notes.trim().length > 0 ? row.notes.trim() : undefined,
    lastCheckedAt: typeof row.last_checked_at === "string" ? row.last_checked_at : new Date().toISOString(),
  };
}

function toControlRow(row: Record<string, unknown> | undefined, tenantId: string): MigrationCutoverControlRow | null {
  if (!row) return null;
  return {
    tenantId,
    dualRunEnabled: row.dual_run_enabled !== false,
    newSystemPrimary: row.new_system_primary === true,
    legacyFallbackEnabled: row.legacy_fallback_enabled !== false,
    migrationFrozen: row.migration_frozen === true,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
    updatedBy: typeof row.updated_by === "string" ? row.updated_by : null,
  };
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function loadParitySummary(tenantId: string) {
  const parityRows = await pool.query(
    `select feature_key, legacy_module, new_module, status, evidence, notes, last_checked_at
     from public.migration_parity_matrix
     where tenant_id = $1
     order by feature_key asc`,
    [tenantId],
  );

  const rows = parityRows.rows.map((row) => toParityRecord(row));
  return {
    rows,
    summary: buildParitySummary(rows),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return json({ error: "tenantId required" }, 400);
  }

  const parity = await loadParitySummary(tenantId);

  const controlsResult = await pool.query(
    `select tenant_id, dual_run_enabled, new_system_primary, legacy_fallback_enabled, migration_frozen, updated_at, updated_by
     from public.migration_cutover_controls
     where tenant_id = $1
     limit 1`,
    [tenantId],
  );

  const snapshot = buildCutoverSnapshot(tenantId, parity.summary, toControlRow(controlsResult.rows[0], tenantId));

  return json({
    ...snapshot,
    parity: {
      rows: parity.rows,
      summary: parity.summary,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const tenantId = typeof body.tenantId === "string" ? body.tenantId.trim() : "";

  if (!tenantId) {
    return json({ error: "tenantId required" }, 400);
  }

  const parity = await loadParitySummary(tenantId);
  const controlsResult = await pool.query(
    `select tenant_id, dual_run_enabled, new_system_primary, legacy_fallback_enabled, migration_frozen, updated_at, updated_by
     from public.migration_cutover_controls
     where tenant_id = $1
     limit 1`,
    [tenantId],
  );
  const currentControls = toControlRow(controlsResult.rows[0], tenantId);
  const currentState = buildCutoverSnapshot(tenantId, parity.summary, currentControls).state;

  const nextState = {
    tenantId,
    dualRunEnabled: coerceOptionalBoolean(body.dualRunEnabled) ?? currentState.dualRunEnabled,
    newSystemPrimary: coerceOptionalBoolean(body.newSystemPrimary) ?? currentState.newSystemPrimary,
    legacyFallbackEnabled: coerceOptionalBoolean(body.legacyFallbackEnabled) ?? currentState.legacyFallbackEnabled,
    migrationFrozen: coerceOptionalBoolean(body.migrationFrozen) ?? currentState.migrationFrozen,
  };

  const readiness = evaluateCutoverReadiness(parity.summary, nextState);
  if (!readiness.allowed) {
    return json({ error: "cutover update rejected", reasons: readiness.reasons }, 400);
  }

  const actorId = typeof body.actorId === "string" && body.actorId.trim() ? body.actorId.trim() : null;
  const client = await pool.connect();

  try {
    await client.query("begin");

    const upsertResult = await client.query(
      `insert into public.migration_cutover_controls
         (tenant_id, dual_run_enabled, new_system_primary, legacy_fallback_enabled, migration_frozen, updated_by, updated_at)
       values ($1, $2, $3, $4, $5, $6, now())
       on conflict (tenant_id)
       do update set
         dual_run_enabled = excluded.dual_run_enabled,
         new_system_primary = excluded.new_system_primary,
         legacy_fallback_enabled = excluded.legacy_fallback_enabled,
         migration_frozen = excluded.migration_frozen,
         updated_by = excluded.updated_by,
         updated_at = now()
       returning tenant_id, dual_run_enabled, new_system_primary, legacy_fallback_enabled, migration_frozen, updated_at, updated_by`,
      [
        tenantId,
        nextState.dualRunEnabled,
        nextState.newSystemPrimary,
        nextState.legacyFallbackEnabled,
        nextState.migrationFrozen,
        actorId,
      ],
    );

    const afterControls = toControlRow(upsertResult.rows[0], tenantId);
    const nextSnapshot = buildCutoverSnapshot(tenantId, parity.summary, afterControls);

    await client.query(
      `insert into public.migration_audit_log
         (tenant_id, actor_id, action, feature_key, before_state, after_state)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        tenantId,
        actorId,
        "cutover_update",
        "cutover-controls",
        currentControls,
        nextSnapshot,
      ],
    );

    await client.query("commit");

    return json({
      ok: true,
      ...nextSnapshot,
      parity: {
        rows: parity.rows,
        summary: parity.summary,
      },
    });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
