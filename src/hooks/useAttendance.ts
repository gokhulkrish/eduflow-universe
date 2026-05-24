import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export function useAttendanceByDate(date: string, grade?: string, section?: string) {
  return useQuery({
    queryKey: ["attendance", date, grade, section],
    queryFn: async () => {
      if (!(await tableExists("attendance"))) return [];
      let query = supabase
        .from("attendance")
        .select("*, students!inner(id, first_name, last_name, admission_no)")
        .eq("date", date)
        .eq("period", "0");
      if (grade) query = query.eq("students.enrollments.grade_label", grade);
      if (section) query = query.eq("students.enrollments.section_label", section);
      const { data } = await query;
      return data ?? [];
    },
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      records,
    }: {
      records: { studentId: string; date: string; status: string; period?: number }[];
    }) => {
      if (!(await tableExists("attendance"))) throw new Error("Attendance table not available");
      const { error } = await supabase.from("attendance").upsert(
        records.map((r) => ({
          student_id: r.studentId,
          date: r.date,
          period: String(r.period ?? 0),
          status: r.status,
        })) as any,
        { onConflict: "student_id,date,period" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}
