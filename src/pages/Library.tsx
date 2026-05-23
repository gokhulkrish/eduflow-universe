import { BookOpen, Clock, DollarSign, Plus, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { useDbList } from "@/hooks/useDbList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";

const reservationsKey = "eduflow_reservations";

type Book = { id: string; isbn: string|null; title: string; author: string|null; category: string|null; total_copies: number; available_copies: number; shelf: string|null };
type Loan = { id: string; book_id: string; student_id: string|null; issued_at: string; due_date: string; returned_at: string|null; status: string; fine: number };

export default function Library() {
  const { data: books, loading: lb } = useDbList<Book>("library_books");
  const { data: loans, loading: ll } = useDbList<Loan>("library_loans", { order: { column: "issued_at", ascending: false } });

  const [reservations, setReservations] = useState(() => {
    try { return JSON.parse(localStorage.getItem(reservationsKey) ?? "[]"); } catch { return []; }
  });
  const [open, setOpen] = useState(false); const [resBook, setResBook] = useState(""); const [resStudent, setResStudent] = useState("");

  useEffect(() => subscribeAppSync([reservationsKey], () => {
    try { setReservations(JSON.parse(localStorage.getItem(reservationsKey) ?? "[]")); } catch { setReservations([]); }
  }), []);

  const pagRes = usePagination({ data: reservations, pageSize: 10 });
  const fineLoans = loans.filter((l) => (l.fine || 0) > 0);
  const pagFines = usePagination({ data: fineLoans, pageSize: 10 });

  const addReservation = () => {
    const items = JSON.parse(localStorage.getItem(reservationsKey) ?? "[]");
    items.push({ id: crypto.randomUUID(), book: resBook, student: resStudent, date: new Date().toISOString(), status: "pending" });
    localStorage.setItem(reservationsKey, JSON.stringify(items));
    emitAppSync(reservationsKey);
    setOpen(false); toast.success("Reservation added");
  };

  const totalBooks = books.reduce((s, b) => s + b.total_copies, 0);
  const available = books.reduce((s, b) => s + b.available_copies, 0);
  const activeLoans = loans.filter((l) => l.status === "issued").length;
  const totalFines = loans.reduce((s, l) => s + (l.fine || 0), 0);

  return (
    <div>
      <PageHeader title="Library" subtitle="Catalog · loans · reservations · fines" icon={<BookOpen className="h-6 w-6" />} />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card className="p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Books</p><p className="mt-1 text-2xl font-bold">{totalBooks}</p></Card>
        <Card className="p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Available</p><p className="mt-1 text-2xl font-bold text-success">{available}</p></Card>
        <Card className="p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Loans</p><p className="mt-1 text-2xl font-bold text-warning">{activeLoans}</p></Card>
        <Card className="p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Fines</p><p className="mt-1 text-2xl font-bold">₹{totalFines}</p></Card>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="reservations">Reservations ({reservations.length})</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4">
          <DataTable rows={books} loading={lb} pageSize={10} columns={[
            { key: "title", header: "Title" },
            { key: "author", header: "Author" },
            { key: "category", header: "Category", render: (r) => <Badge variant="secondary">{r.category}</Badge> },
            { key: "isbn", header: "ISBN", className: "font-mono text-xs" },
            { key: "shelf", header: "Shelf" },
            { key: "total_copies", header: "Total" },
            { key: "available_copies", header: "Available", render: (r) => {
              const pct = r.total_copies > 0 ? Math.round((r.available_copies / r.total_copies) * 100) : 0;
              return <Badge className={pct === 0 ? "bg-destructive/15 text-destructive" : pct < 50 ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}>{r.available_copies}/{r.total_copies}</Badge>;
            }},
          ]} />
        </TabsContent>

        <TabsContent value="loans" className="mt-4">
          <DataTable rows={loans} loading={ll} pageSize={10} columns={[
            { key: "book_id", header: "Book ID" },
            { key: "student_id", header: "Student" },
            { key: "issued_at", header: "Issued", render: (r) => new Date(r.issued_at).toLocaleDateString() },
            { key: "due_date", header: "Due", render: (r) => {
              const d = new Date(r.due_date); const overdue = d < new Date() && r.status === "issued";
              return <span className={overdue ? "text-destructive font-medium" : ""}>{d.toLocaleDateString()}</span>;
            }},
            { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
            { key: "fine", header: "Fine", render: (r) => r.fine > 0 ? `₹${r.fine}` : "—" },
          ]} />
        </TabsContent>

        <TabsContent value="reservations" className="mt-4">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setResBook(""); setResStudent(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Reservation</Button></div>
          <TablePagination {...pagRes} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Book</TableHead><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {pagRes.pageData.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.book}</TableCell>
                  <TableCell className="text-xs">{r.student}</TableCell>
                  <TableCell className="text-xs">{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-warning/15 text-warning">{r.status}</Badge></TableCell>
                </TableRow>
              ))}
              {reservations.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No reservations</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="fines" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Fine Collection</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pagFines} />
              <Table>
              <TableHeader className="">
                <TableRow><TableHead className="text-xs">Loan ID</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow>
              </TableHeader>
                <TableBody>
                  {pagFines.pageData.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{l.id}</TableCell>
                      <TableCell className="text-xs">₹{l.fine}</TableCell>
                      <TableCell><Badge className="text-[9px]">{l.status === "returned" ? "Paid" : "Pending"}</Badge></TableCell>
                      <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => toast.success("Fine collected")}><DollarSign className="h-3 w-3 mr-1" />Collect</Button></TableCell>
                    </TableRow>
                  ))}
                  {fineLoans.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No fines due</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Reservation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Book Title</Label><Input value={resBook} onChange={(e) => setResBook(e.target.value)} /></div>
            <div><Label className="text-xs">Student Name</Label><Input value={resStudent} onChange={(e) => setResStudent(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={addReservation} disabled={!resBook || !resStudent}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
