import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { FileText, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

type Document = { id: string; documentTitle: string; documentType: string; owner: string; expiryDate: string; documentStatus: string; };
const DMS_KEY = "eduflow_dms";
function ls(): Document[] { try { return JSON.parse(localStorage.getItem(DMS_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Document[]) { localStorage.setItem(DMS_KEY, JSON.stringify(v)); emitAppSync(DMS_KEY); }

export default function DocumentDms() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [docType, setDocType] = useState(""); const [owner, setOwner] = useState(""); const [expiry, setExpiry] = useState(""); const [status, setStatus] = useState("");
  const filtered = items.filter((d) => !search || d.documentTitle.toLowerCase().includes(search.toLowerCase()) || d.owner?.toLowerCase().includes(search.toLowerCase()) || d.documentType?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([DMS_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Documents & DMS" subtitle="Templates, institutional evidence, student files & digital records" icon={<FileText className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Documents</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Approved</p><p className="text-2xl font-bold">{items.filter((d) => d.documentStatus === "Approved").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Pending Review</p><p className="text-2xl font-bold">{items.filter((d) => d.documentStatus === "Under Review" || d.documentStatus === "Draft").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Expired</p><p className="text-2xl font-bold text-destructive">{items.filter((d) => d.documentStatus === "Expired").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setTitle(""); setDocType(""); setOwner(""); setExpiry(""); setStatus(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Document</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Title</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Owner</TableHead><TableHead className="text-xs">Expiry</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="text-xs font-medium">{d.documentTitle}</TableCell>
              <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{d.documentType || "—"}</Badge></TableCell>
              <TableCell className="text-xs">{d.owner || "—"}</TableCell>
              <TableCell className="text-xs">{d.expiryDate || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${d.documentStatus === "Approved" ? "bg-success/15 text-success" : d.documentStatus === "Under Review" ? "bg-info/15 text-info" : d.documentStatus === "Expired" ? "bg-destructive/15 text-destructive" : d.documentStatus === "Archived" ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"}`}>{d.documentStatus || "Draft"}</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== d.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching documents" : "No documents added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Document Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div><div><Label className="text-xs">Document Type</Label><Select value={docType} onValueChange={setDocType}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Student File">Student File</SelectItem><SelectItem value="Policy">Policy</SelectItem><SelectItem value="Evidence">Evidence</SelectItem><SelectItem value="Template">Template</SelectItem><SelectItem value="Certificate">Certificate</SelectItem><SelectItem value="Contract">Contract</SelectItem></SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Owner</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div><div><Label className="text-xs">Expiry Date</Label><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div></div>
            <div><Label className="text-xs">Document Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Under Review">Under Review</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Expired">Expired</SelectItem><SelectItem value="Archived">Archived</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), documentTitle: title, documentType: docType, owner, expiryDate: expiry, documentStatus: status }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
