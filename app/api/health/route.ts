import { NextResponse } from "next/server";
import { createSupabaseClient } from "../../../lib/supabase";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, string> = {};

  const supabase = createSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("students").select("id").limit(1);
    checks.database = error ? `error: ${error.message}` : "ok";
  } else {
    checks.database = "not configured";
  }

  const envOk = Boolean(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL,
  );
  checks.environment = envOk ? "ok" : "missing supabase url";

  return NextResponse.json({
    status: checks.database === "ok" ? "healthy" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    duration: Date.now() - start,
    checks,
  });
}
