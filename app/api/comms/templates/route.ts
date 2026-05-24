import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "../../../../lib/supabase";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: [], error: "Supabase not configured" }, 503);

  const type = request.nextUrl.searchParams.get("type");
  let query = supabase.from("message_templates").select("*").order("name");
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return json({ data: [], error: error.message }, 500);
  return json({ data, error: null });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: null, error: "Supabase not configured" }, 503);

  try {
    const body = await request.json();
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("message_templates")
      .insert({ ...body, created_by: auth.user?.id ?? null })
      .select()
      .single();
    if (error) return json({ data: null, error: error.message }, 400);
    return json({ data, error: null }, 201);
  } catch (err) {
    return json({ data: null, error: err instanceof Error ? err.message : "Unknown error" }, 400);
  }
}
