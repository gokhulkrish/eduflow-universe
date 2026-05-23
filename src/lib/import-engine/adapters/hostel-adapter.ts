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
    title: "Hostel & Room",
    fields: [
      { key: "hostelName", label: "Hostel Name", aliases: ["hostel_name", "hostel", "hostel name"], required: true },
      { key: "roomNumber", label: "Room Number", aliases: ["room_number", "room", "room no", "room_no"], required: true },
      { key: "floor", label: "Floor", aliases: ["floor"] },
      { key: "costPerTerm", label: "Cost per Term", aliases: ["cost_per_term", "cost", "hostel fee"] },
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

      const hostelName = row.mapped.hostelName || row.sourceRow.hostelName || "";
      const roomNumber = row.mapped.roomNumber || row.sourceRow.roomNumber || "";

      let hostelId: string | null = null;
      const { data: hostels } = await supabase.from("hostels").select("id").eq("name", hostelName).limit(1);
      if (hostels && hostels.length > 0) hostelId = hostels[0].id;
      if (!hostelId) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: `Hostel not found: ${hostelName}` }); continue; }

      let roomId: string | null = null;
      const { data: rooms } = await supabase.from("hostel_rooms").select("id").eq("hostel_id", hostelId).eq("room_number", roomNumber).limit(1);
      if (rooms && rooms.length > 0) roomId = rooms[0].id;
      if (!roomId) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: `Room ${roomNumber} not found in ${hostelName}` }); continue; }

      const allocatedFrom = row.mapped.allocatedFrom || new Date().toISOString().split("T")[0];
      const allocatedTo = row.mapped.allocatedTo || null;

      if (row.action === "insert") {
        const { data: result, error } = await (supabase.from("hostel_allocations") as any).insert({
          hostel_room_id: roomId, student_id: student.id,
          allocated_from: allocatedFrom, allocated_to: allocatedTo, status: "active",
        }).select().single();
        if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { inserted++; rowResults.push({ rowKey: row.rowKey, id: result.id, action: "inserted" }); }
      } else if (row.action === "update") {
        const { data: existing } = await supabase.from("hostel_allocations").select("id").eq("student_id", student.id).maybeSingle();
        if (existing) {
          const { error } = await (supabase.from("hostel_allocations") as any).update({
            hostel_room_id: roomId, allocated_from: allocatedFrom, allocated_to: allocatedTo,
          }).eq("id", existing.id);
          if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
          else { updated++; rowResults.push({ rowKey: row.rowKey, id: existing.id, action: "updated" }); }
        } else {
          const { data: result, error } = await (supabase.from("hostel_allocations") as any).insert({
            hostel_room_id: roomId, student_id: student.id,
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
  emitAppSync("sms.hostel.v1");
  return { inserted, updated, skipped, failed, errors, rowResults };
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  const { supabase } = await import("@/integrations/supabase/client");
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("hostel_allocations").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await supabase.from("hostel_allocations").update(entry.previousState as any).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const hostelModule: ImportModule = {
  id: "hostel",
  name: "Hostel",
  description: "Import hostel room allocations and student assignments",
  icon: "Building2",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};
