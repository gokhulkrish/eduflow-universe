import { pool } from "@/db/pool";
import type { PoolClient } from "pg";

export interface DashboardMetric {
  key: string;
  label: string;
  value: number | string;
  meta?: string;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  updatedAt: string;
}

export interface MonitoringSnapshot {
  tenantId: string;
  academicYearId?: string;
  studentCount: number;
  batchCount: number;
  workflowCount: number;
  lastStudentActivity?: string;
  sourceCoverage?: number;
  healthStatus: "good" | "warning" | "critical";
  updatedAt: string;
}

export interface RefreshMonitoringInput {
  tenantId: string;
  academicYearId?: string;
}

export interface MonitoringHealthPolicy {
  minSourceCoverage: number;
  staleAfterMinutes: number;
  recentBatchWindowDays: number;
}

export interface MonitoringRefreshResult {
  snapshot: MonitoringSnapshot;
  metrics: DashboardMetric[];
  issues: string[];
  healthStatus: MonitoringSnapshot["healthStatus"];
  academicYearLabel?: string;
  district?: string;
}

const DEFAULT_POLICY: MonitoringHealthPolicy = {
  minSourceCoverage: 40,
  staleAfterMinutes: 24 * 60,
  recentBatchWindowDays: 30,
};

const ACTIVE_IMPORT_BATCH_STATUSES = [
  "draft",
  "uploaded",
  "keying",
  "duplicates",
  "validating",
  "preview",
  "ready_to_transfer",
  "transferring",
];

const ACTIVE_CAMPAIGN_STATUSES = ["queued", "scheduled", "sending", "draft"];

const ACTIVE_PROMOTION_STATUSES = ["queued", "scheduled", "running", "draft"];

const DASHBOARD_SNAPSHOT_KEYS = {
  studentCount: "student-count",
  batchCount: "import-batches",
  workflowCount: "workflow-activity",
  lastStudentActivity: "last-student-activity",
  sourceCoverage: "source-coverage",
  academicYearFocus: "academic-year-focus",
  districtStatus: "district-status",
} as const;

async function tableExists(client: PoolClient, tableName: string): Promise<boolean> {
  const { rows } = await client.query<{ present: boolean }>(
    "select to_regclass($1) is not null as present",
    [tableName],
  );
  return Boolean(rows[0]?.present);
}

function isoOrUndefined(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function asText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function roundPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function relativeTimeLabel(isoValue?: string): string {
  if (!isoValue) return "No recent student activity";

  const timestamp = new Date(isoValue).getTime();
  if (!Number.isFinite(timestamp)) return "No recent student activity";

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes <= 1) return "Updated just now";
  if (diffMinutes < 60) return `Updated ${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return diffDays < 7 ? `Updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago` : `Updated ${new Date(timestamp).toLocaleDateString()}`;
}

function extractDistrict(meta: unknown): string | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  const raw = meta as Record<string, unknown>;
  return (
    asText(raw.district) ||
    asText(raw.institute_district) ||
    asText(raw["Institute District / Block"]) ||
    asText(raw.identity && typeof raw.identity === "object" && !Array.isArray(raw.identity) ? (raw.identity as Record<string, unknown>).district : undefined) ||
    asText(raw.profile && typeof raw.profile === "object" && !Array.isArray(raw.profile) ? (raw.profile as Record<string, unknown>).district : undefined)
  );
}

async function resolveAcademicYear(
  client: PoolClient,
  tenantId: string,
  academicYearId?: string,
): Promise<{ academicYearId?: string; academicYearLabel?: string }> {
  if (!(await tableExists(client, "public.academic_years"))) return {};

  const filters: string[] = ["institution_id = $1"];
  const params: Array<string> = [tenantId];

  if (academicYearId) {
    filters.push("id = $2");
    params.push(academicYearId);
  } else {
    filters.push("(is_current = true or status = 'active')");
  }

  const { rows } = await client.query<{ id: string; label: string }>(
    `
      select id, label
      from public.academic_years
      where ${filters.join(" and ")}
      order by is_current desc, updated_at desc, created_at desc
      limit 1
    `,
    params,
  );

  const row = rows[0];
  return row ? { academicYearId: row.id, academicYearLabel: row.label } : {};
}

async function resolveInstituteContext(client: PoolClient, tenantId: string) {
  if (!(await tableExists(client, "public.institutions"))) {
    return { district: undefined, instituteName: undefined };
  }

  const { rows } = await client.query<{ name: string; code: string | null; meta: unknown }>(
    `
      select name, code, meta
      from public.institutions
      where id = $1
      limit 1
    `,
    [tenantId],
  );

  const row = rows[0];
  if (!row) return { district: undefined, instituteName: undefined };

  return {
    district: extractDistrict(row.meta),
    instituteName: row.name || row.code || undefined,
  };
}

async function countStudentSnapshot(
  client: PoolClient,
  tenantId: string,
  academicYearId?: string,
): Promise<{
  studentCount: number;
  sourceLinkedCount: number;
  lastStudentActivity?: string;
}> {
  if (!(await tableExists(client, "public.students"))) {
    return { studentCount: 0, sourceLinkedCount: 0 };
  }

  const hasEnrollments = academicYearId ? await tableExists(client, "public.enrollments") : false;
  const yearJoin = academicYearId && hasEnrollments ? "left join public.enrollments e on e.student_id = s.id" : "";
  const yearFilter = academicYearId && hasEnrollments ? "and e.academic_year_id = $2" : "";
  const params = academicYearId && hasEnrollments ? [tenantId, academicYearId] : [tenantId];

  const { rows } = await client.query<{
    student_count: string | number;
    source_linked_count: string | number;
    last_student_activity: string | null;
  }>(
    `
      select
        count(distinct s.id)::int as student_count,
        count(distinct s.id) filter (where coalesce(nullif(s.umis_id, ''), nullif(s.emis_id, '')) is not null)::int as source_linked_count,
        max(s.updated_at) as last_student_activity
      from public.students s
      ${yearJoin}
      where s.institution_id = $1
      ${yearFilter}
    `,
    params,
  );

  const row = rows[0];
  return {
    studentCount: Number(row?.student_count ?? 0),
    sourceLinkedCount: Number(row?.source_linked_count ?? 0),
    lastStudentActivity: isoOrUndefined(row?.last_student_activity ?? undefined),
  };
}

async function countImportBatches(
  client: PoolClient,
  tenantId: string,
  recentWindowDays = DEFAULT_POLICY.recentBatchWindowDays,
): Promise<{
  batchCount: number;
  activeWorkflowCount: number;
}> {
  if (!(await tableExists(client, "public.import_batches"))) {
    return { batchCount: 0, activeWorkflowCount: 0 };
  }

  const batchRes = await client.query<{ total_batches: string | number }>(
    `
      select count(*)::int as total_batches
      from public.import_batches
      where institution_id = $1
        and updated_at >= now() - make_interval(days => $2)
    `,
    [tenantId, recentWindowDays],
  );

  const activeImportRes = await client.query<{ count: string | number }>(
    `
      select count(*)::int as count
      from public.import_batches
      where institution_id = $1
        and status = any ($2::text[])
    `,
    [tenantId, ACTIVE_IMPORT_BATCH_STATUSES],
  );

  let activeCampaignCount = 0;
  if (await tableExists(client, "public.message_campaigns")) {
    const { rows } = await client.query<{ count: string | number }>(
      `
        select count(*)::int as count
        from public.message_campaigns
        where institution_id = $1
          and status = any ($2::text[])
      `,
      [tenantId, ACTIVE_CAMPAIGN_STATUSES],
    );
    activeCampaignCount = Number(rows[0]?.count ?? 0);
  }

  let activePromotionCount = 0;
  if (await tableExists(client, "public.promotion_runs")) {
    const { rows } = await client.query<{ count: string | number }>(
      `
        select count(*)::int as count
        from public.promotion_runs pr
        join public.promotion_rules r on r.id = pr.rule_id
        where r.institution_id = $1
          and pr.status = any ($2::text[])
      `,
      [tenantId, ACTIVE_PROMOTION_STATUSES],
    );
    activePromotionCount = Number(rows[0]?.count ?? 0);
  }

  return {
    batchCount: Number(batchRes.rows[0]?.total_batches ?? 0),
    activeWorkflowCount: Number(activeImportRes.rows[0]?.count ?? 0) + activeCampaignCount + activePromotionCount,
  };
}

async function buildDashboardMetrics(
  client: PoolClient,
  input: RefreshMonitoringInput,
): Promise<MonitoringRefreshResult> {
  const now = new Date().toISOString();
  const [academicYear, institute, studentStats, batchStats] = await Promise.all([
    resolveAcademicYear(client, input.tenantId, input.academicYearId),
    resolveInstituteContext(client, input.tenantId),
    countStudentSnapshot(client, input.tenantId, input.academicYearId),
    countImportBatches(client, input.tenantId),
  ]);

  const sourceCoverage = studentStats.studentCount > 0
    ? roundPercentage((studentStats.sourceLinkedCount / studentStats.studentCount) * 100)
    : 0;

  const snapshot: MonitoringSnapshot = {
    tenantId: input.tenantId,
    academicYearId: academicYear.academicYearId,
    studentCount: studentStats.studentCount,
    batchCount: batchStats.batchCount,
    workflowCount: batchStats.activeWorkflowCount,
    lastStudentActivity: studentStats.lastStudentActivity,
    sourceCoverage,
    healthStatus: "good",
    updatedAt: now,
  };

  const issues: string[] = [];
  if (snapshot.studentCount === 0) {
    issues.push("No student records found for this tenant");
  }
  if (snapshot.batchCount === 0 && snapshot.workflowCount === 0) {
    issues.push("No recent import operations or active workflows");
  }
  if (!academicYear.academicYearId) {
    issues.push("Academic year focus is not configured");
  }
  if (!institute.district) {
    issues.push("Institute district is not configured");
  }

  const healthStatus = issues.some((issue) => issue.toLowerCase().includes("not configured")) ? "warning" : evaluateHealth(snapshot);
  snapshot.healthStatus = issues.length > 0 ? healthStatus : evaluateHealth(snapshot);

  const metrics: DashboardMetric[] = [
    {
      key: DASHBOARD_SNAPSHOT_KEYS.studentCount,
      label: "Total Students",
      value: snapshot.studentCount,
      meta: "Registry volume",
      tone: snapshot.studentCount > 0 ? "success" : "warning",
      updatedAt: now,
    },
    {
      key: DASHBOARD_SNAPSHOT_KEYS.batchCount,
      label: "Import Operations",
      value: snapshot.batchCount,
      meta: `Tracked in the last ${DEFAULT_POLICY.recentBatchWindowDays} days`,
      tone: snapshot.batchCount > 0 ? "primary" : "warning",
      updatedAt: now,
    },
    {
      key: DASHBOARD_SNAPSHOT_KEYS.workflowCount,
      label: "Workflow Activity",
      value: snapshot.workflowCount,
      meta: "Active workflow sessions",
      tone: snapshot.workflowCount > 0 ? "success" : "warning",
      updatedAt: now,
    },
    {
      key: DASHBOARD_SNAPSHOT_KEYS.lastStudentActivity,
      label: "Last Student Activity",
      value: snapshot.lastStudentActivity ?? now,
      meta: relativeTimeLabel(snapshot.lastStudentActivity),
      tone: snapshot.lastStudentActivity ? "primary" : "warning",
      updatedAt: now,
    },
    {
      key: DASHBOARD_SNAPSHOT_KEYS.sourceCoverage,
      label: "Source Coverage",
      value: snapshot.sourceCoverage ?? 0,
      meta: snapshot.sourceCoverage ? "UMIS/EMIS-linked" : "No source links yet",
      tone: snapshot.sourceCoverage && snapshot.sourceCoverage >= DEFAULT_POLICY.minSourceCoverage ? "success" : "warning",
      updatedAt: now,
    },
    {
      key: DASHBOARD_SNAPSHOT_KEYS.academicYearFocus,
      label: "Academic Year Focus",
      value: academicYear.academicYearLabel ?? "Waiting for student intake",
      meta: academicYear.academicYearId ? "Current focus" : "Not configured",
      tone: academicYear.academicYearId ? "primary" : "warning",
      updatedAt: now,
    },
    {
      key: DASHBOARD_SNAPSHOT_KEYS.districtStatus,
      label: "District / Block",
      value: institute.district ?? "Institute district not configured",
      meta: institute.instituteName ?? undefined,
      tone: institute.district ? "success" : "warning",
      updatedAt: now,
    },
  ];

  return {
    snapshot,
    metrics,
    issues,
    healthStatus: snapshot.healthStatus,
    academicYearLabel: academicYear.academicYearLabel,
    district: institute.district,
  };
}

async function persistMetricRows(
  client: PoolClient,
  snapshot: MonitoringSnapshot,
  metrics: DashboardMetric[],
): Promise<void> {
  if (!(await tableExists(client, "public.dashboard_snapshots"))) return;

  for (const metric of metrics) {
    if (!snapshot.academicYearId) {
      const update = await client.query(
        `
          update public.dashboard_snapshots
          set snapshot_value = $3::jsonb, updated_at = now()
          where tenant_id = $1
            and academic_year_id is null
            and snapshot_key = $2
        `,
        [snapshot.tenantId, metric.key, JSON.stringify(metric)],
      );

      if (update.rowCount && update.rowCount > 0) continue;
    }

    await client.query(
      `
        insert into public.dashboard_snapshots (
          tenant_id, academic_year_id, snapshot_key, snapshot_value, updated_at
        ) values ($1, $2, $3, $4::jsonb, now())
        on conflict (tenant_id, academic_year_id, snapshot_key)
        do update set snapshot_value = excluded.snapshot_value, updated_at = now()
      `,
      [snapshot.tenantId, snapshot.academicYearId ?? null, metric.key, JSON.stringify(metric)],
    );
  }
}

async function persistHealthSnapshot(
  client: PoolClient,
  snapshot: MonitoringSnapshot,
  issues: string[],
): Promise<void> {
  if (!(await tableExists(client, "public.system_health_snapshots"))) return;

  await client.query(
    `
      insert into public.system_health_snapshots (
        tenant_id, health_status, issues, counters, updated_at
      ) values ($1, $2, $3::jsonb, $4::jsonb, now())
      on conflict do nothing
    `,
    [
      snapshot.tenantId,
      snapshot.healthStatus,
      JSON.stringify(issues),
      JSON.stringify({
        studentCount: snapshot.studentCount,
        batchCount: snapshot.batchCount,
        workflowCount: snapshot.workflowCount,
        lastStudentActivity: snapshot.lastStudentActivity ?? null,
        sourceCoverage: snapshot.sourceCoverage ?? null,
        academicYearId: snapshot.academicYearId ?? null,
      }),
    ],
  );
}

async function persistMonitoringEvent(
  client: PoolClient,
  result: MonitoringRefreshResult,
): Promise<void> {
  if (!(await tableExists(client, "public.monitoring_events"))) return;

  await client.query(
    `
      insert into public.monitoring_events (
        tenant_id, event_type, subject_type, subject_id, payload, created_at
      ) values ($1, $2, $3, $4, $5::jsonb, now())
    `,
    [
      result.snapshot.tenantId,
      "dashboard.snapshot.refreshed",
      "dashboard",
      result.snapshot.academicYearId ?? null,
      JSON.stringify({
        metrics: result.metrics,
        snapshot: result.snapshot,
        issues: result.issues,
      }),
    ],
  );
}

export function evaluateHealth(
  snapshot: Pick<MonitoringSnapshot, "studentCount" | "batchCount" | "workflowCount" | "sourceCoverage" | "lastStudentActivity">,
  policy: MonitoringHealthPolicy = DEFAULT_POLICY,
): MonitoringSnapshot["healthStatus"] {
  if (snapshot.studentCount === 0) return "warning";
  if (snapshot.batchCount === 0 && snapshot.workflowCount === 0) return "warning";
  if (typeof snapshot.sourceCoverage === "number" && snapshot.sourceCoverage > 0 && snapshot.sourceCoverage < policy.minSourceCoverage) {
    return "warning";
  }
  if (snapshot.lastStudentActivity) {
    const ageMinutes = Math.max(0, Math.round((Date.now() - new Date(snapshot.lastStudentActivity).getTime()) / 60000));
    if (Number.isFinite(ageMinutes) && ageMinutes > policy.staleAfterMinutes) {
      return "warning";
    }
  }
  return "good";
}

export async function refreshMonitoringSnapshot(
  input: RefreshMonitoringInput,
): Promise<MonitoringRefreshResult> {
  if (!input.tenantId) {
    throw new Error("tenantId is required");
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await buildDashboardMetrics(client, input);
    await persistMetricRows(client, result.snapshot, result.metrics);
    await persistHealthSnapshot(client, result.snapshot, result.issues);
    await persistMonitoringEvent(client, result);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function readDashboardSnapshots(input: RefreshMonitoringInput) {
  const client = await pool.connect();
  try {
    if (!(await tableExists(client, "public.dashboard_snapshots"))) return [];
    const { rows } = await client.query(
      `
        select snapshot_key, snapshot_value, updated_at, academic_year_id
        from public.dashboard_snapshots
        where tenant_id = $1
          and ($2::uuid is null or academic_year_id = $2)
        order by updated_at desc, snapshot_key asc
      `,
      [input.tenantId, input.academicYearId ?? null],
    );
    return rows;
  } finally {
    client.release();
  }
}

export async function readLatestHealthSnapshot(tenantId: string) {
  const client = await pool.connect();
  try {
    if (!(await tableExists(client, "public.system_health_snapshots"))) return null;
    const { rows } = await client.query(
      `
        select tenant_id, health_status, issues, counters, updated_at
        from public.system_health_snapshots
        where tenant_id = $1
        order by updated_at desc
        limit 1
      `,
      [tenantId],
    );
    return rows[0] ?? null;
  } finally {
    client.release();
  }
}
