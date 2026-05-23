import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Staff Identity",
    fields: [
      { key: "employeeNo", label: "Employee No", aliases: ["employee_no", "employee number", "emp_no", "emp id", "staff_id"], required: true },
      { key: "fullName", label: "Full Name", aliases: ["full_name", "name", "staff name", "employee name"], required: true },
      { key: "email", label: "Email", aliases: ["email", "e-mail", "email address"] },
      { key: "phone", label: "Phone", aliases: ["phone", "mobile", "contact", "telephone"] },
    ],
  },
  {
    title: "Employment Details",
    fields: [
      { key: "designation", label: "Designation", aliases: ["designation", "title", "post", "role", "position"] },
      { key: "department", label: "Department", aliases: ["department", "dept", "department_name"] },
      { key: "qualification", label: "Qualification", aliases: ["qualification", "education", "qualifications"] },
      { key: "specialization", label: "Specialization", aliases: ["specialization", "speciality", "subject"] },
    ],
  },
  {
    title: "Leave & Payroll",
    fields: [
      { key: "leaveType", label: "Leave Type", aliases: ["leave_type", "leave", "type of leave"] },
      { key: "leaveDays", label: "Leave Days", aliases: ["leave_days", "days", "number of days"] },
      { key: "leaveStart", label: "Leave Start", aliases: ["leave_start", "start_date", "leave from"] },
      { key: "leaveEnd", label: "Leave End", aliases: ["leave_end", "end_date", "leave to"] },
      { key: "basicPay", label: "Basic Pay", aliases: ["basic_pay", "basic", "salary", "pay"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "employee_no_only", label: "Employee Number Only", fields: ["employeeNo"] },
  { id: "name_only", label: "Staff Name Only", fields: ["fullName"] },
  { id: "emp_no_or_name", label: "Employee No OR Name", fields: ["employeeNo", "fullName"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await (supabase.from("staff") as any).select("id, employee_no, full_name, email");
  return (data || []).map((s: Record<string, unknown>) => ({
    staffId: s.id, employeeNo: s.employee_no, fullName: s.full_name, email: s.email,
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
      const employeeNo = row.mapped.employeeNo || row.sourceRow.employeeNo || "";
      const fullName = row.mapped.fullName || row.sourceRow.fullName || "";
      if (!employeeNo || !fullName) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: "Employee No and Full Name are required" }); continue; }

      const email = row.mapped.email || null;
      const phone = row.mapped.phone || null;
      const designation = row.mapped.designation || null;

      const { data: existingStaff } = await supabase.from("staff").select("id").eq("employee_no", employeeNo).maybeSingle();

      if (row.action === "insert" && !existingStaff) {
        const { data: result, error } = await (supabase.from("staff") as any).insert({
          employee_no: employeeNo, full_name: fullName, email, phone, designation, meta: {}, status: "active",
        }).select().single();
        if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { inserted++; rowResults.push({ rowKey: row.rowKey, id: result.id, action: "inserted" }); }
      } else if (row.action === "update" || existingStaff) {
        const targetId = existingStaff?.id;
        if (!targetId) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: `Staff not found: ${employeeNo}` }); continue; }
        const { error } = await (supabase.from("staff") as any).update({
          full_name: fullName, email, phone, designation,
        }).eq("id", targetId);
        if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { updated++; rowResults.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      failed++; errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : "Unknown error" });
    }
  }
  emitAppSync("sms.staff.v1");
  return { inserted, updated, skipped, failed, errors, rowResults };
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  const { supabase } = await import("@/integrations/supabase/client");
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("staff").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await supabase.from("staff").update(entry.previousState as any).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const hrModule: ImportModule = {
  id: "hr",
  name: "HR / Staff",
  description: "Import staff records, including personal info and employment details",
  icon: "UserRound",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};
