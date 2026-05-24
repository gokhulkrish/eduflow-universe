import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "../../../lib/supabase";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: [], error: "Supabase not configured" }, 503);

  const category = request.nextUrl.searchParams.get("category");
  let query = supabase.from("remarks_templates").select("*").order("name");
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return json({ data: [], error: error.message }, 500);
  return json({ data, error: null });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: null, error: "Supabase not configured" }, 503);

  const body = await request.json();
  const { data, error } = await supabase
    .from("remarks_templates")
    .insert({
      name: body.name,
      category: body.category,
      min_score: body.minScore,
      max_score: body.maxScore,
      template: body.template,
      variables: body.variables,
      is_default: body.isDefault,
    })
    .select()
    .single();

  if (error) return json({ data: null, error: error.message }, 400);
  return json({ data, error: null }, 201);
}
