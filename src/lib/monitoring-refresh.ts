import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export const MONITORING_REFRESH_SYNC_KEY = "sms.monitoring.refresh.v1";

export interface MonitoringContext {
  tenantId: string;
  academicYearId?: string;
}

export function canUseMonitoringApi(): boolean {
  if (typeof window === "undefined") return true;
  return Boolean(document.querySelector("script#__NEXT_DATA__"));
}

export async function resolveMonitoringContext(): Promise<MonitoringContext | null> {
  if (!(await tableExists("institutions"))) return null;

  const { data: institution } = await supabase
    .from("institutions")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!institution?.id) return null;

  let academicYearId: string | undefined;
  if (await tableExists("academic_years")) {
    const { data: academicYear } = await supabase
      .from("academic_years")
      .select("id")
      .eq("institution_id", institution.id)
      .order("is_current", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    academicYearId = academicYear?.id ?? undefined;
  }

  return {
    tenantId: institution.id,
    academicYearId,
  };
}

export async function requestMonitoringRefresh(context?: Partial<MonitoringContext>): Promise<void> {
  if (!canUseMonitoringApi()) {
    emitAppSync(MONITORING_REFRESH_SYNC_KEY);
    return;
  }

  const resolved = context?.tenantId ? context : await resolveMonitoringContext();
  if (!resolved?.tenantId) return;

  const response = await fetch("/api/monitoring/snapshot", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      tenantId: resolved.tenantId,
      academicYearId: resolved.academicYearId ?? null,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Monitoring refresh failed");
  }

  emitAppSync(MONITORING_REFRESH_SYNC_KEY);
}
