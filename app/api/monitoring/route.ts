import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "../../../lib/supabase";
import { getMonitoringOverview } from "../../../core/monitoring/service";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: [], error: "Supabase not configured", meta: { page: 1, limit: 50, total: 0 } }, 503);

  const searchParams = request.nextUrl.searchParams;
  const { rows, total } = await getMonitoringOverview({
    grade: searchParams.get("grade") ?? undefined,
    section: searchParams.get("section") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    limit: Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50))),
    offset: Math.max(0, Number(searchParams.get("offset") || 0)),
  });
  return json({
    data: rows, error: null,
    meta: {
      page: Math.floor(Number(searchParams.get("offset") || 0) / Math.max(1, Number(searchParams.get("limit") || 50))) + 1,
      limit: Number(searchParams.get("limit") || 50),
      total,
    },
  });
}
