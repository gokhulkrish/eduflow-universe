export type LegacyLibraryCatalogItem = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  totalCopies: number;
  availableCopies: number;
};

export type LegacyLibraryLoan = {
  id: string;
  bookId: string;
  studentId: string;
  borrowedOn: string;
  dueOn: string;
  returnedOn: string | null;
  status: string;
};

export type LegacyLibraryFilter = {
  category?: string;
  search?: string;
  studentId?: string;
};

export async function listLibraryCatalogLegacy(filter: LegacyLibraryFilter = {}): Promise<LegacyLibraryCatalogItem[]> {
  const { supabase } = await import("../../src/integrations/supabase/client");
  const db = supabase.from("library_catalog" as never);
  let q = db.select("*");
  if (filter.search) q = (q as any).or(`title.ilike.%${filter.search}%,author.ilike.%${filter.search}%`);
  if (filter.category) q = (q as any).filter("category", "eq", filter.category);
  q = (q as any).order("title", { ascending: true });

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    author: r.author ? String(r.author) : null,
    isbn: r.isbn ? String(r.isbn) : null,
    category: r.category ? String(r.category) : null,
    totalCopies: Number(r.total_copies ?? 0),
    availableCopies: Number(r.available_copies ?? 0),
  }));
}

export async function listLibraryLoansLegacy(filter: LegacyLibraryFilter = {}): Promise<LegacyLibraryLoan[]> {
  const { supabase } = await import("../../src/integrations/supabase/client");
  const db = supabase.from("library_loans" as never);
  let q = db.select("*");
  if (filter.studentId) q = (q as any).eq("student_id", filter.studentId);
  q = (q as any).order("borrowed_on", { ascending: false }).limit(500);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    bookId: String(r.book_id ?? ""),
    studentId: String(r.student_id ?? ""),
    borrowedOn: String(r.borrowed_on ?? ""),
    dueOn: String(r.due_on ?? ""),
    returnedOn: r.returned_on ? String(r.returned_on) : null,
    status: String(r.status ?? "active"),
  }));
}
