import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { useDbList } from "@/hooks/useDbList";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Book = { id: string; isbn: string|null; title: string; author: string|null; category: string|null; total_copies: number; available_copies: number; shelf: string|null };
type Loan = { id: string; book_id: string; student_id: string|null; issued_at: string; due_date: string; returned_at: string|null; status: string; fine: number };

export default function Library() {
  const { data: books, loading: lb } = useDbList<Book>("library_books");
  const { data: loans, loading: ll } = useDbList<Loan>("library_loans", { order: { column: "issued_at", ascending: false } });

  return (
    <div>
      <PageHeader title="Library Catalog" subtitle={`${books.length} titles · ${loans.filter(l=>l.status==='issued').length} active loans`} icon={<BookOpen className="h-6 w-6" />} />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Total Books", value: books.reduce((s,b)=>s+b.total_copies,0) },
          { label: "Available", value: books.reduce((s,b)=>s+b.available_copies,0) },
          { label: "Outstanding Loans", value: loans.filter(l=>l.status==='issued').length },
        ].map(k => (
          <Card key={k.label} className="glass p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{k.value}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="catalog">
        <TabsList><TabsTrigger value="catalog">Catalog</TabsTrigger><TabsTrigger value="loans">Loans</TabsTrigger></TabsList>
        <TabsContent value="catalog" className="mt-4">
          <DataTable rows={books} loading={lb} columns={[
            { key: "title", header: "Title" },
            { key: "author", header: "Author" },
            { key: "category", header: "Category", render: r => <Badge variant="secondary">{r.category}</Badge> },
            { key: "isbn", header: "ISBN", className: "font-mono text-xs" },
            { key: "shelf", header: "Shelf" },
            { key: "avail", header: "Available", render: r => `${r.available_copies}/${r.total_copies}` },
          ]} />
        </TabsContent>
        <TabsContent value="loans" className="mt-4">
          <DataTable rows={loans} loading={ll} empty="No loans yet." columns={[
            { key: "book_id", header: "Book ID", className: "font-mono text-xs" },
            { key: "issued_at", header: "Issued", render: r => new Date(r.issued_at).toLocaleDateString() },
            { key: "due_date", header: "Due" },
            { key: "status", header: "Status", render: r => <Badge variant="secondary">{r.status}</Badge> },
            { key: "fine", header: "Fine", render: r => `₹${r.fine}` },
          ]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
