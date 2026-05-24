import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "../../../../lib/supabase";
import { executePromotion } from "../../../../core/academics/promotion";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: null, error: "Supabase not configured" }, 503);

  try {
    const { rule, eligible } = await request.json();
    const result = await executePromotion(rule, eligible);
    return json({ data: result, error: null }, 201);
  } catch (err) {
    return json({ data: null, error: err instanceof Error ? err.message : "Unknown error" }, 400);
  }
}
