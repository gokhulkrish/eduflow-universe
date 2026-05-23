import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Student Identity",
    fields: [
      { key: "admissionNo", label: "Admission No", aliases: ["admission_no", "admission number", "registration_no", "reg_no", "student_id"], required: true },
      { key: "fullName", label: "Student Name", aliases: ["name", "student_name", "full_name"] },
    ],
  },
  {
    title: "Route Details",
    fields: [
      { key: "routeName", label: "Route Name", aliases: ["route_name", "route", "route name"], required: true },
      { key: "routeCode", label: "Route Code", aliases: ["route_code", "route code", "code"] },
      { key: "vehicleNo", label: "Vehicle No", aliases: ["vehicle_no", "vehicle number", "bus no", "bus number", "vehicle"] },
      { key: "costPerTerm", label: "Cost per Term", aliases: ["cost_per_term", "cost", "fee", "transport fee"] },
      { key: "pickupStop", label: "Pickup Stop", aliases: ["pickup_stop", "stop", "pickup point", "boarding point"] },
    ],
  },
  {
    title: "Allocation Period",
    fields: [
      { key: "allocatedFrom", label: "Allocated From", aliases: ["allocated_from", "from", "start date", "start_date"] },
      { key: "allocatedTo", label: "Allocated To", aliases: ["allocated_to", "to", "end date", "end_date"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "admission_only", label: "Admission Number Only", fields: ["admissionNo"] },
  { id: "name_only", label: "Student Name Only", fields: ["fullName"] },
  { id: "admission_or_name", label: "Admission No OR Name", fields: ["admissionNo", "fullName"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await (supabase.from("students") as any).select("id, admission_no, first_name, last_name");
  return (data || []).map((s: Record<string, unknown>) => ({
    studentId: s.id, admissionNo: s.admission_no, fullName: [s.first_name, s.last_name].filter(Boolean).join(" "),
  }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch): Promise<ImportCommitResult> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { emitAppSync } = await import("@/lib/app-sync");
  let inserted = 0, updated = 0, skipped = 0, failed = 0;
  const rowResults: { rowKey: string; id: string; action: "inserted" | "updated" | "skipped" | "failed" }[] = [];
  const errors: { rowNumber: number; message: string }[] = [];

  for (const row of rows) {
    if (row.action === "skip") { skipped++; continue; }
    try {
      const admissionNo = row.mapped.admissionNo || row.sourceRow.admissionNo || "";
      const { data: student } = await supabase.from("students").select("id").eq("admission_no", admissionNo).maybeSingle();
      if (!student) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: `Student not found: ${admissionNo}` }); continue; }

      const routeName = row.mapped.routeName || row.sourceRow.routeName || "";
      let routeId: string | null = null;
      const { data: routes } = await supabase.from("transport_routes").select("id").eq("route_name", routeName).limit(1);
      if (routes && routes.length > 0) routeId = routes[0].id;
      if (!routeId) {
        const { data: newRoute } = await (supabase.from("transport_routes") as any).insert({ route_name: routeName, route_code: row.mapped.routeCode || null, vehicle_no: row.mapped.vehicleNo || null, status: "active" }).select().single();
        if (newRoute) routeId = newRoute.id;
      }

      const pickupStop = row.mapped.pickupStop || null;
      const allocatedFrom = row.mapped.allocatedFrom || new Date().toISOString().split("T")[0];
      const allocatedTo = row.mapped.allocatedTo || null;

      if (row.action === "insert") {
        const { data: result, error } = await (supabase.from("transport_allocations") as any).insert({
          transport_route_id: routeId, student_id: student.id, pickup_stop: pickupStop,
          allocated_from: allocatedFrom, allocated_to: allocatedTo, status: "active",
        }).select().single();
        if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { inserted++; rowResults.push({ rowKey: row.rowKey, id: result.id, action: "inserted" }); }
      } else if (row.action === "update") {
        const { data: existing } = await supabase.from("transport_allocations").select("id").eq("student_id", student.id).maybeSingle();
        if (existing) {
          const { error } = await (supabase.from("transport_allocations") as any).update({
            transport_route_id: routeId, pickup_stop: pickupStop, allocated_from: allocatedFrom, allocated_to: allocatedTo,
          }).eq("id", existing.id);
          if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
          else { updated++; rowResults.push({ rowKey: row.rowKey, id: existing.id, action: "updated" }); }
        } else {
          const { data: result, error } = await (supabase.from("transport_allocations") as any).insert({
            transport_route_id: routeId, student_id: student.id, pickup_stop: pickupStop,
            allocated_from: allocatedFrom, allocated_to: allocatedTo, status: "active",
          }).select().single();
          if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
          else { inserted++; rowResults.push({ rowKey: row.rowKey, id: result.id, action: "inserted" }); }
        }
      }
    } catch (err) {
      failed++; errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : "Unknown error" });
    }
  }
  emitAppSync("sms.transport.v1");
  return { inserted, updated, skipped, failed, errors, rowResults };
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  const { supabase } = await import("@/integrations/supabase/client");
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("transport_allocations").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await supabase.from("transport_allocations").update(entry.previousState as any).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const transportModule: ImportModule = {
  id: "transport",
  name: "Transport",
  description: "Import transport route allocations and student assignments",
  icon: "Bus",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};
