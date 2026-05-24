import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "../../../../../lib/supabase";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: null, error: "Supabase not configured" }, 503);

  const { id } = await context.params;
  const { data, error } = await supabase.from("message_templates").select("*").eq("id", id).single();
  if (error) return json({ data: null, error: error.message }, 404);
  return json({ data, error: null });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: null, error: "Supabase not configured" }, 503);

  const { id } = await context.params;
  const { error } = await supabase.from("message_templates").delete().eq("id", id);
  if (error) return json({ data: null, error: error.message }, 500);
  return json({ data: { id }, error: null });
}
