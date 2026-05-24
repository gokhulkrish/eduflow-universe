import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "../../../lib/supabase";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: [], error: "Supabase not configured", meta: { page: 1, limit: 50, total: 0 } }, 503);

  const searchParams = request.nextUrl.searchParams;
  const entity = searchParams.get("entity");
  const entityId = searchParams.get("entityId");
  const action = searchParams.get("action");
  const actorId = searchParams.get("actorId");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));

  let query = supabase.from("audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (entity) query = query.eq("entity", entity);
  if (entityId) query = query.eq("entity_id", entityId);
  if (action) query = query.eq("action", action);
  if (actorId) query = query.eq("actor", actorId);

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return json({ data: null, error: error.message, meta: { page: 1, limit, total: 0 } }, 500);
  return json({
    data, error: null,
    meta: { page: Math.floor(offset / limit) + 1, limit, total: count || 0 },
  });
}
