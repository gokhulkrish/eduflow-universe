import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/db/pool";
import {
  buildParitySummary,
  parseParityStatus,
  type ParityRecord,
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

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return json({ error: "tenantId required" }, 400);
  }

  const rowsResult = await pool.query(
    `select feature_key, legacy_module, new_module, status, evidence, notes, last_checked_at
     from public.migration_parity_matrix
     where tenant_id = $1
     order by feature_key asc`,
    [tenantId],
  );

  const auditResult = await pool.query(
    `select count(*)::int as entries, max(created_at) as last_audit_at
     from public.migration_audit_log
     where tenant_id = $1`,
    [tenantId],
  );

  const rows = rowsResult.rows.map((row) => toParityRecord(row));
  const summary = buildParitySummary(rows);
  const auditRow = auditResult.rows[0] ?? {};

  return json({
    rows,
    summary,
    audit: {
      entries: Number(auditRow.entries ?? 0),
      lastAuditAt: typeof auditRow.last_audit_at === "string" ? auditRow.last_audit_at : null,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tenantId = typeof body.tenantId === "string" ? body.tenantId.trim() : "";
  const featureKey = typeof body.featureKey === "string" ? body.featureKey.trim() : "";
  const legacyModule = typeof body.legacyModule === "string" ? body.legacyModule.trim() : "";
  const newModule = typeof body.newModule === "string" ? body.newModule.trim() : "";
  const status = parseParityStatus(body.status);
  const evidence = typeof body.evidence === "string" ? body.evidence.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const actorId = typeof body.actorId === "string" && body.actorId.trim() ? body.actorId.trim() : null;

  if (!tenantId || !featureKey || !status) {
    return json({ error: "tenantId, featureKey, and status required" }, 400);
  }

  if ((status === "verified" || status === "retired") && !evidence) {
    return json({ error: "evidence is required before a feature can become verified or retired" }, 400);
  }

  const client = await pool.connect();

  try {
    await client.query("begin");

    const currentParity = await client.query(
      `select feature_key, legacy_module, new_module, status, evidence, notes, last_checked_at
       from public.migration_parity_matrix
       where tenant_id = $1
       order by feature_key asc`,
      [tenantId],
    );

    const currentRecord = currentParity.rows.find((row) => String(row.feature_key ?? "") === featureKey) ?? null;
    const currentRecordNormalized = currentRecord ? toParityRecord(currentRecord) : null;
    const currentSummary = buildParitySummary(currentParity.rows.map((row) => toParityRecord(row)));

    if (status === "retired") {
      if (!currentRecord || parseParityStatus(currentRecord.status) !== "verified") {
        await client.query("rollback");
        return json({ error: "feature must be verified before it can be retired" }, 400);
      }

      const cutoverRows = await client.query(
        `select tenant_id, dual_run_enabled, new_system_primary, legacy_fallback_enabled, migration_frozen, updated_at, updated_by
         from public.migration_cutover_controls
         where tenant_id = $1
         limit 1`,
        [tenantId],
      );

      const controls = cutoverRows.rows[0];
      const readyForRetirement =
        controls?.dual_run_enabled === true &&
        controls?.new_system_primary === true &&
        controls?.legacy_fallback_enabled === true &&
        controls?.migration_frozen === true &&
        currentSummary.readyForCutover;

      if (!readyForRetirement) {
        await client.query("rollback");
        return json(
          {
            error: "legacy retirement is only allowed after cutover is frozen, primary, fallback-enabled, and parity-complete",
          },
          400,
        );
      }
    }

    const upsertResult = await client.query(
      `insert into public.migration_parity_matrix
         (tenant_id, feature_key, legacy_module, new_module, status, evidence, notes, last_checked_at)
       values ($1, $2, nullif($3, ''), nullif($4, ''), $5, nullif($6, ''), nullif($7, ''), now())
       on conflict (tenant_id, feature_key)
       do update set
         legacy_module = excluded.legacy_module,
         new_module = excluded.new_module,
         status = excluded.status,
         evidence = excluded.evidence,
         notes = excluded.notes,
         last_checked_at = now(),
         updated_at = now()
       returning feature_key, legacy_module, new_module, status, evidence, notes, last_checked_at`,
      [tenantId, featureKey, legacyModule, newModule, status, evidence, notes],
    );

    const nextRecord = toParityRecord(upsertResult.rows[0] ?? {});

    await client.query(
      `insert into public.migration_audit_log
         (tenant_id, actor_id, action, feature_key, before_state, after_state)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        tenantId,
        actorId,
        "parity_update",
        featureKey,
        currentRecordNormalized,
        nextRecord,
      ],
    );

    await client.query("commit");

    const refreshedParity = await pool.query(
      `select feature_key, legacy_module, new_module, status, evidence, notes, last_checked_at
       from public.migration_parity_matrix
       where tenant_id = $1
       order by feature_key asc`,
      [tenantId],
    );

    const rows = refreshedParity.rows.map((row) => toParityRecord(row));

    return json({
      ok: true,
      record: nextRecord,
      summary: buildParitySummary(rows),
      evidenceRequiredForVerified: true,
      previousState: currentRecordNormalized,
    });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
