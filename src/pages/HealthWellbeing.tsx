import "@/lib/runtime-storage";
import { useCallback, useEffect, useState } from "react";
import { Heart, Plus, Pencil, Trash2, Search, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useRealtime } from "@/lib/use-realtime";
import { getHealthCases, createHealthCase, updateHealthCase, deleteHealthCase, HealthCase } from "@/lib/health-cases";

export default function HealthWellbeing() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HealthCase[]>([]); const [search, setSearch] = useState("");
  const refresh = useCallback(async () => { setItems(await getHealthCases()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime("health_cases", refresh);
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [title, setTitle] = useState(""); const [person, setPerson] = useState(""); const [caseType, setCaseType] = useState(""); const [followUp, setFollowUp] = useState(""); const [status, setStatus] = useState(""); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setTitle(""); setPerson(""); setCaseType(""); setFollowUp(""); setStatus(""); setOpen(true); };
  const openEdit = (c: HealthCase) => { setEditId(c.id); setTitle(c.caseTitle); setPerson(c.personName); setCaseType(c.caseType); setFollowUp(c.followUpDate); setStatus(c.careStatus); setOpen(true); };
  const filtered = items.filter((c) => !search || c.caseTitle.toLowerCase().includes(search.toLowerCase()) || c.personName?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Health & Wellbeing" subtitle="Health records, counselling & campus clinic follow-ups" icon={<Heart className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Cases</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Open</p><p className="text-2xl font-bold">{items.filter((c) => c.careStatus === "Open" || c.careStatus === "Monitoring").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Referred</p><p className="text-2xl font-bold">{items.filter((c) => c.careStatus === "Referred").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Closed</p><p className="text-2xl font-bold">{items.filter((c) => c.careStatus === "Closed").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input id="healthSearch" name="healthSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cases..." className="flex-1 h-9 text-xs" />
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=health")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(items, "health-cases", [{key:"caseTitle",label:"Case Title"},{key:"personName",label:"Person"},{key:"caseType",label:"Type"},{key:"followUpDate",label:"Follow-up"},{key:"careStatus",label:"Status"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Case</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Case Title</TableHead><TableHead className="text-xs">Person</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Follow-up</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-xs font-medium">{c.caseTitle}</TableCell>
              <TableCell className="text-xs">{c.personName || "—"}</TableCell>
              <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{c.caseType || "—"}</Badge></TableCell>
              <TableCell className="text-xs">{c.followUpDate || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${c.careStatus === "Closed" ? "bg-success/15 text-success" : c.careStatus === "Open" || c.careStatus === "Monitoring" ? "bg-info/15 text-info" : c.careStatus === "Referred" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{c.careStatus || "Open"}</Badge></TableCell>
              <TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3 w-3" /></Button></div></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching cases" : "No health cases recorded"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Case</AlertDialogTitle><AlertDialogDescription>This will permanently remove this health case. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteHealthCase(deleteId); refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Health Case" : "Add Health Case"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="caseTitle">Case Title</Label><Input id="caseTitle" name="caseTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div><div><Label className="text-xs" htmlFor="personName">Person Name</Label><Input id="personName" name="personName" value={person} onChange={(e) => setPerson(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="caseType">Case Type</Label><Select name="caseType" value={caseType} onValueChange={setCaseType}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Medical">Medical</SelectItem><SelectItem value="Counselling">Counselling</SelectItem><SelectItem value="Emergency">Emergency</SelectItem><SelectItem value="Wellbeing">Wellbeing</SelectItem><SelectItem value="Follow-up">Follow-up</SelectItem></SelectContent></Select></div><div><Label className="text-xs" htmlFor="followUpDate">Follow-up Date</Label><Input id="followUpDate" name="followUpDate" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="careStatus">Care Status</Label><Select name="careStatus" value={status} onValueChange={setStatus}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="Monitoring">Monitoring</SelectItem><SelectItem value="Referred">Referred</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title} onClick={async () => { if (editId) { await updateHealthCase(editId, { caseTitle: title, personName: person, caseType, followUpDate: followUp, careStatus: status }); } else { await createHealthCase({ caseTitle: title, personName: person, caseType, followUpDate: followUp, careStatus: status }); } refresh(); setOpen(false); toast.success(editId ? "Updated" : "Added"); }}>{editId ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
