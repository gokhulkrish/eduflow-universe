import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "../../../../lib/supabase";
import { checkEligibility } from "../../../../core/academics/promotion";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: null, error: "Supabase not configured" }, 503);

  try {
    const body = await request.json();
    const eligible = await checkEligibility(body);
    return json({ data: eligible, error: null, meta: { page: 1, limit: eligible.length, total: eligible.length } });
  } catch (err) {
    return json({ data: null, error: err instanceof Error ? err.message : "Unknown error" }, 400);
  }
}
