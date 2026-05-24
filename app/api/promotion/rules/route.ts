import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "../../../../lib/supabase";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: [], error: "Supabase not configured", meta: { page: 1, limit: 50, total: 0 } }, 503);

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("promotion_rules")
    .select("*", { count: "exact" })
    .order("name")
    .range(from, to);

  if (error) return json({ data: null, error: error.message, meta: { page, limit, total: 0 } }, 500);
  return json({ data, error: null, meta: { page, limit, total: count || 0 } });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: null, error: "Supabase not configured", meta: { page: 1, limit: 1, total: 0 } }, 503);

  const body = await request.json();
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("promotion_rules")
    .insert({ ...body, created_by: auth.user?.id ?? null })
    .select()
    .single();

  if (error) return json({ data: null, error: error.message, meta: { page: 1, limit: 1, total: 0 } }, 400);
  return json({ data, error: null, meta: { page: 1, limit: 1, total: 1 } }, 201);
}
