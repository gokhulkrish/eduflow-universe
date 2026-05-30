import { useEffect, useState } from "react";
import { Swords, Plus, Pencil, Trash2, AlertTriangle, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useRealtime } from "@/lib/use-realtime";
import { getIncidents, createIncident, updateIncident, deleteIncident, disciplineKey, type Incident } from "@/lib/discipline";

export default function DisciplineRecord() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Incident[]>([]); const [loading, setLoading] = useState(true); const refresh = async () => setItems(await getIncidents());
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [student, setStudent] = useState(""); const [type, setType] = useState(""); const [desc, setDesc] = useState(""); const [date, setDate] = useState(""); const [severity, setSeverity] = useState("minor"); const [action, setAction] = useState(""); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setStudent(""); setType(""); setDesc(""); setDate(new Date().toISOString().split("T")[0]); setSeverity("minor"); setAction(""); setOpen(true); };
  const openEdit = (i: Incident) => { setEditId(i.id); setStudent(i.student); setType(i.type); setDesc(i.description); setDate(i.date.slice(0, 10)); setSeverity(i.severity); setAction(i.action || ""); setOpen(true); };

  useEffect(() => { refresh().then(() => setLoading(false)); }, []);
  useRealtime("discipline_incidents", refresh);

  const pag = usePagination({ data: items, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Discipline Record" subtitle="Track student incidents & actions" icon={<Swords className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Incidents</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Open</p><p className="text-2xl font-bold text-warning">{items.filter((i) => i.status === "open").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Resolved</p><p className="text-2xl font-bold text-success">{items.filter((i) => i.status === "resolved").length}</p></Card>
      </div>
      <div className="flex justify-end gap-2 mb-4"><Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=discipline")}><Upload className="h-4 w-4 mr-1" /> Import</Button><Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(items, "discipline", [{key:"student",label:"Student"},{key:"type",label:"Type"},{key:"date",label:"Date"},{key:"severity",label:"Severity"},{key:"description",label:"Description"},{key:"action",label:"Action"},{key:"status",label:"Status"}])}><Download className="h-4 w-4 mr-1" /> Export</Button><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Record Incident</Button></div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Severity</TableHead><TableHead className="text-xs">Action</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((i) => (
            <TableRow key={i.id}>
              <TableCell className="text-xs">{i.student}</TableCell>
              <TableCell className="text-xs">{i.type}</TableCell>
              <TableCell className="text-xs">{new Date(i.date).toLocaleDateString()}</TableCell>
              <TableCell><Badge className={`text-[9px] ${i.severity === "major" ? "bg-destructive/15 text-destructive" : i.severity === "moderate" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{i.severity}</Badge></TableCell>
              <TableCell className="text-xs">{i.action || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${i.status === "resolved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{i.status}</Badge></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openEdit(i)}><Pencil className="h-3 w-3" /></Button>
                  {i.status === "open" && <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={async () => { await updateIncident(i.id, { status: "resolved" }); await refresh(); toast.success("Resolved"); }}>Resolve</Button>}
                  <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setDeleteId(i.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No incidents recorded</TableCell></TableRow>}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Incident</AlertDialogTitle><AlertDialogDescription>This will permanently remove this incident record. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteIncident(deleteId); await refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Incident" : "Record Incident"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="studentName">Student Name</Label><Input id="studentName" name="studentName" value={student} onChange={(e) => setStudent(e.target.value)} /></div><div><Label className="text-xs" htmlFor="incidentDate">Date</Label><Input id="incidentDate" name="incidentDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="incidentType">Type</Label><Input id="incidentType" name="incidentType" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Misconduct" /></div><div><Label className="text-xs" htmlFor="severity">Severity</Label><Select name="severity" value={severity} onValueChange={setSeverity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minor">Minor</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="major">Major</SelectItem></SelectContent></Select></div></div>
            <div><Label className="text-xs" htmlFor="description">Description</Label><Textarea id="description" name="description" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
            <div><Label className="text-xs" htmlFor="actionTaken">Action Taken</Label><Input id="actionTaken" name="actionTaken" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Warning" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!student || !type} onClick={async () => { if (editId) { await updateIncident(editId, { student, type, description: desc, date: new Date(date).toISOString(), severity, action }); } else { await createIncident({ student, type, description: desc, date: new Date(date).toISOString(), severity, action, status: "open" }); } await refresh(); setOpen(false); toast.success(editId ? "Updated" : "Recorded"); }}>{editId ? "Update" : "Record"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
