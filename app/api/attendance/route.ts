import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseClient } from "../../../lib/supabase";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: [], error: "Supabase not configured", meta: { page: 1, limit: 50, total: 0 } }, 503);

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const grade = searchParams.get("grade");
  const section = searchParams.get("section");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("attendance")
    .select("*, students!inner(id, first_name, last_name, admission_no, enrollments!inner(grade_label, section_label))", { count: "exact" })
    .eq("date", date);

  if (grade) query = query.eq("students.enrollments.grade_label", grade);
  if (section) query = query.eq("students.enrollments.section_label", section);

  const { data, error, count } = await query.order("students.first_name").range(from, to);
  if (error) return json({ data: null, error: error.message, meta: { page, limit, total: 0 } }, 500);
  return json({ data, error: null, meta: { page, limit, total: count || 0 } });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
  if (!supabase) return json({ data: null, error: "Supabase not configured" }, 503);

  const { records, markedBy } = await request.json();
  const { data: auth } = await supabase.auth.getUser();
  const userId = markedBy || auth.user?.id || null;

  const { error } = await supabase.from("attendance").upsert(
    records.map((r: any) => ({
      student_id: r.studentId,
      date: r.date,
      period: r.period ?? 0,
      status: r.status,
      marked_by: userId,
    })),
    { onConflict: "student_id,date,period" },
  );

  if (error) return json({ data: null, error: error.message }, 400);
  return json({ data: { inserted: records.length }, error: null }, 201);
}
