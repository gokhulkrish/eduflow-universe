import { supabase } from "../../src/integrations/supabase/client";

export interface MonitoringOverviewRow {
  student_id: string;
  admission_no: string;
  display_name: string;
  grade_label: string | null;
  section_label: string | null;
  enrollment_status: string;
  attendance_percent: number | null;
  exam_percent: number | null;
  subjective_score: number | null;
}

export interface MonitoringFilter {
  grade?: string;
  section?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getMonitoringOverview(filters?: MonitoringFilter): Promise<{
  rows: MonitoringOverviewRow[];
  total: number;
}> {
  let query = supabase
    .from("monitoring_overview" as any)
    .select("*", { count: "exact" });

  if (filters?.grade) query = query.eq("grade_label", filters.grade);
  if (filters?.section) query = query.eq("section_label", filters.section);
  if (filters?.status) query = query.eq("enrollment_status", filters.status);
  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(`display_name.ilike.${term},admission_no.ilike.${term}`);
  }

  const { data, error, count } = await query
    .order("display_name", { ascending: true })
    .range(filters?.offset ?? 0, (filters?.offset ?? 0) + (filters?.limit ?? 50) - 1);

  if (error) {
    console.error("[monitoring] query failed:", error);
    return { rows: [], total: 0 };
  }
  return { rows: (data ?? []) as unknown as MonitoringOverviewRow[], total: count ?? 0 };
}

export async function subscribeMonitoringOverview(
  callback: (payload: { new: MonitoringOverviewRow }) => void,
  filter?: { grade?: string },
) {
  const channel = supabase
    .channel("monitoring-overview-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "monitoring_overview" },
      (payload) => {
        const row = payload.new as MonitoringOverviewRow;
        if (filter?.grade && row.grade_label !== filter.grade) return;
        callback({ new: row });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
