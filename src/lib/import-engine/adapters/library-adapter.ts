import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";
import { ensureStudentExists } from "@/lib/student-records";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Book Info",
    fields: [
      { key: "title", label: "Title", aliases: ["title", "book_title", "book name", "name"], required: true },
      { key: "isbn", label: "ISBN", aliases: ["isbn", "isbn_no", "isbn number"] },
      { key: "authors", label: "Authors", aliases: ["authors", "author", "author(s)"] },
      { key: "publisher", label: "Publisher", aliases: ["publisher", "publication"] },
      { key: "quantity", label: "Quantity", aliases: ["quantity", "copies", "qty"] },
      { key: "locationShelf", label: "Shelf Location", aliases: ["location_shelf", "shelf", "location", "rack"] },
    ],
  },
  {
    title: "Issue / Transaction",
    fields: [
      { key: "admissionNo", label: "Student Admission No", aliases: ["admission_no", "admission number", "student_id", "reg_no"] },
      { key: "staffId", label: "Staff ID", aliases: ["staff_id", "staff", "employee_no"] },
      { key: "issuedOn", label: "Issued On", aliases: ["issued_on", "issue date", "issued date"] },
      { key: "dueOn", label: "Due On", aliases: ["due_on", "due date", "return due"] },
      { key: "fineAmount", label: "Fine", aliases: ["fine_amount", "fine", "penalty", "late fee"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "isbn_only", label: "ISBN Match", fields: ["isbn"] },
  { id: "title_only", label: "Book Title Match", fields: ["title"] },
  { id: "isbn_or_title", label: "ISBN or Title", fields: ["isbn", "title"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const [booksRes, studentsRes] = await Promise.all([
    (supabase.from("library_books") as any).select("id, title, isbn, authors, available_quantity"),
    (supabase.from("students") as any).select("id, admission_no, first_name, last_name"),
  ]);
  return [
    ...(booksRes.data || []).map((b: Record<string, unknown>) => ({ ...b, _type: "book" })),
    ...(studentsRes.data || []).map((s: Record<string, unknown>) => ({
      studentId: s.id, admissionNo: s.admission_no,
      fullName: [s.first_name, s.last_name].filter(Boolean).join(" "), _type: "student",
    })),
  ];
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  let inserted = 0, updated = 0, skipped = 0, failed = 0;
  const rowResults: { rowKey: string; id: string; action: "inserted" | "updated" | "skipped" | "failed" }[] = [];
  const errors: { rowNumber: number; message: string }[] = [];

  for (const row of rows) {
    if (row.action === "skip") { skipped++; continue; }
    if (signal?.aborted) break;
    let newStudentId: string | null = null;
    try {
      const title = row.mapped.title || row.sourceRow.title || "";
      if (!title) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: "Title is required" }); continue; }

      const isbn = row.mapped.isbn || null;
      const authors = row.mapped.authors || null;
      const publisher = row.mapped.publisher || null;
      const quantity = parseInt(row.mapped.quantity || "1");
      const locationShelf = row.mapped.locationShelf || null;

      if (row.action === "insert") {
        const { data: existingBook } = await supabase.from("library_books").select("id").eq("isbn", isbn).maybeSingle();
        if (existingBook) {
          const { error } = await supabase.from("library_books").update({
            quantity: quantity, available_quantity: quantity,
          } as any).eq("id", existingBook.id);
          if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
          else { updated++; rowResults.push({ rowKey: row.rowKey, id: existingBook.id, action: "updated" }); }
        } else {
          const { data: result, error } = await (supabase.from("library_books") as any).insert({
            title, isbn, authors, publisher, quantity, available_quantity: quantity, location_shelf: locationShelf, meta: {}, status: "active",
          }).select().single();
          if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
          else { inserted++; rowResults.push({ rowKey: row.rowKey, id: result.id, action: "inserted" }); }
        }
      } else if (row.action === "update") {
        const admissionNo = row.mapped.admissionNo || null;
        const staffId = row.mapped.staffId || null;
        const issuedOn = row.mapped.issuedOn || new Date().toISOString().split("T")[0];
        const dueOn = row.mapped.dueOn || null;
        const fineAmount = parseFloat(row.mapped.fineAmount || "0");

        let bookId: string | null = null;
        if (isbn) {
          const { data: book } = await supabase.from("library_books").select("id").eq("isbn", isbn).maybeSingle();
          if (book) bookId = book.id;
        }
        if (!bookId) {
          const { data: books } = await supabase.from("library_books").select("id").eq("title", title).limit(1);
          if (books && books.length > 0) bookId = books[0].id;
        }
        if (!bookId) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: `Book not found: ${title}` }); continue; }

        const { data: studentPreExisting } = admissionNo
          ? await supabase.from("students").select("id").eq("admission_no", admissionNo).maybeSingle()
          : { data: null as any };
        const studentId = admissionNo
          ? await ensureStudentExists(admissionNo, row.mapped.fullName || row.sourceRow.fullName || "")
          : null;
        if (admissionNo && !studentPreExisting) newStudentId = studentId;

        const { data: result, error } = await (supabase.from("library_issues") as any).insert({
          library_book_id: bookId, student_id: studentId, staff_id: staffId || null,
          issued_on: issuedOn, due_on: dueOn, fine_amount: fineAmount, status: "active",
        }).select().single();
        if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { newStudentId = null; inserted++; rowResults.push({ rowKey: row.rowKey, id: result.id, action: "inserted" }); }
      }
    } catch (err) {
      if (newStudentId) {
        await supabase.from("students").delete().eq("id", newStudentId).maybeSingle();
      }
      failed++; errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }
  emitAppSync("sms.library.v1");
  return { inserted, updated, skipped, failed, errors, rowResults };
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("library_books").delete().eq("id", entry.studentKey);
        if (!error) { restored++; continue; }
        const { error: e2 } = await supabase.from("library_issues").delete().eq("id", entry.studentKey);
        if (!e2) restored++;
        else throw e2;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("library_books") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (!error) restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const libraryModule: ImportModule = {
  id: "library",
  name: "Library",
  description: "Import book records, inventory, and issue/transaction data",
  icon: "BookOpen",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};
