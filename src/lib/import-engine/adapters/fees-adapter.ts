import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";
import { ensureStudentExists } from "@/lib/student-records";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Student Identity",
    fields: [
      { key: "admissionNo", label: "Admission No", aliases: ["admission_no", "admission number", "registration_no", "reg_no", "roll_no", "student_id"] },
      { key: "fullName", label: "Student Name", aliases: ["name", "student_name", "studentname", "full_name"] },
      { key: "grade", label: "Grade / Class", aliases: ["grade", "class", "standard", "level"] },
      { key: "section", label: "Section", aliases: ["section", "division", "sec"] },
      { key: "academicYear", label: "Academic Year", aliases: ["academic year", "year", "session", "academic_year"] },
    ],
  },
  {
    title: "Payment Details",
    fields: [
      { key: "amountPaid", label: "Amount Paid", aliases: ["amount", "amount_paid", "paid", "amount paid", "fee amount", "payment_amount"], required: true },
      { key: "paymentDate", label: "Payment Date", aliases: ["payment_date", "date", "paid_date", "transaction date", "payment date"], required: true },
      { key: "paymentMethod", label: "Payment Method", aliases: ["payment_method", "method", "payment mode", "mode", "payment type"] },
      { key: "transactionReference", label: "Transaction Reference", aliases: ["transaction_reference", "reference", "ref_no", "txn_id", "transaction id", "transaction no"] },
      { key: "receiptNo", label: "Receipt No", aliases: ["receipt_no", "receipt number", "receipt", "receipt#"] },
      { key: "feeCategory", label: "Fee Category", aliases: ["fee_category", "fee type", "fee head", "category", "fee_category_id"] },
      { key: "remarks", label: "Remarks", aliases: ["remarks", "notes", "comment", "description"] },
    ],
  },
  {
    title: "Invoice Details",
    fields: [
      { key: "invoiceNo", label: "Invoice No", aliases: ["invoice_no", "invoice number", "invoice", "inv_no"] },
      { key: "dueDate", label: "Due Date", aliases: ["due_date", "due date", "due"] },
      { key: "amountDue", label: "Amount Due", aliases: ["amount_due", "due amount", "total due", "fee amount"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "admission_only", label: "Admission Number Only", fields: ["admissionNo"] },
  { id: "name_only", label: "Student Name Only", fields: ["fullName"] },
  { id: "admission_or_name", label: "Admission No OR Student Name", fields: ["admissionNo", "fullName"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("students") as any)
    .select("id, admission_no, first_name, last_name");
  return (data || []).map((s: Record<string, unknown>) => ({
    studentId: s.id,
    admissionNo: s.admission_no,
    fullName: [s.first_name, s.last_name].filter(Boolean).join(" "),
  }));
}

async function commitRows(
  rows: ImportPreviewRow[],
  batch: ImportBatch,
): Promise<ImportCommitResult> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: { rowNumber: number; message: string }[] = [];

  for (const row of rows) {
    if (row.action === "skip") {
      skipped++;
      continue;
    }

    let newStudentId: string | null = null;

    try {
      const admissionNo = row.mapped.admissionNo || row.sourceRow.admissionNo || "";
      const studentId = await ensureStudentExists(admissionNo, row.mapped.fullName || row.sourceRow.fullName || "");
      newStudentId = studentId;

      const amountPaid = parseFloat(row.mapped.amountPaid || "0");
      if (isNaN(amountPaid) || amountPaid <= 0) {
        failed++;
        errors.push({ rowNumber: row.sourceRowIndex, message: `Invalid amount: ${row.mapped.amountPaid}` });
        continue;
      }

      const paymentDate = row.mapped.paymentDate || new Date().toISOString().split("T")[0];
      const paymentMethod = row.mapped.paymentMethod || "cash";
      const transactionReference = row.mapped.transactionReference || null;
      const receiptNo = row.mapped.receiptNo || null;

      if (row.action === "insert") {
        const { error: insertError } = await (supabase.from("fee_payments") as any).insert({
          student_id: studentId,
          amount_paid: amountPaid,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          transaction_reference: transactionReference,
          receipt_no: receiptNo,
          status: "completed",
          meta: {},
        });

        if (insertError) {
          failed++;
          errors.push({ rowNumber: row.sourceRowIndex, message: insertError.message });
        } else {
          newStudentId = null;
          inserted++;
        }
      } else if (row.action === "update") {
        const { data: existingPayments } = await supabase
          .from("fee_payments")
          .select("id")
          .eq("student_id", studentId)
          .eq("transaction_reference", transactionReference)
          .maybeSingle();

        if (existingPayments) {
          const { error: updateError } = await (supabase.from("fee_payments") as any)
            .update({
              amount_paid: amountPaid,
              payment_date: paymentDate,
              payment_method: paymentMethod,
              receipt_no: receiptNo,
            })
            .eq("id", existingPayments.id);

          if (updateError) {
            failed++;
            errors.push({ rowNumber: row.sourceRowIndex, message: updateError.message });
          } else {
            newStudentId = null;
            updated++;
          }
        } else {
          const { error: insertError } = await (supabase.from("fee_payments") as any).insert({
            student_id: studentId,
            amount_paid: amountPaid,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            transaction_reference: transactionReference,
            receipt_no: receiptNo,
            status: "completed",
            meta: {},
          });

          if (insertError) {
            failed++;
            errors.push({ rowNumber: row.sourceRowIndex, message: insertError.message });
          } else {
            newStudentId = null;
            inserted++;
          }
        }
      }
    } catch (err) {
      if (newStudentId) {
        await supabase.from("students").delete().eq("id", newStudentId).maybeSingle();
      }
      failed++;
      errors.push({
        rowNumber: row.sourceRowIndex,
        message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error"),
      });
    }
  }

  emitAppSync("sms.fee-payments.v1");

  return { inserted, updated, skipped, failed, errors };
}

async function rollbackRows(
  rollbackData: ImportRollbackEntry[],
): Promise<{ success: boolean; restored: number }> {
  let restored = 0;
  let success = true;

  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase
          .from("fee_payments")
          .delete()
          .eq("id", entry.studentKey);
        if (error) throw error;
        restored++;
      }
    } catch {
      success = false;
    }
  }

  return { success, restored };
}

export const feesModule: ImportModule = {
  id: "fees",
  name: "Fee Payments",
  description: "Import fee payment records, including amounts, dates, and payment methods",
  icon: "DollarSign",
  fieldGroups,
  matchStrategies,
  adapter: {
    loadExistingRecords,
    commitRows,
    rollbackRows,
  },
};
