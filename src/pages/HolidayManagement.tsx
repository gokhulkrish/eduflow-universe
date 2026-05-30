import { useEffect, useState } from "react";
import { Sun, Plus, Pencil, Trash2, Download, Upload } from "lucide-react";
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
import { useRealtime } from "@/lib/use-realtime";
import { getHolidays, createHoliday, updateHoliday, deleteHoliday, HOLIDAYS_KEY, type Holiday } from "@/lib/holidays";

export default function HolidayManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Holiday[]>([]); const [loading, setLoading] = useState(true);
  const refresh = async () => setItems(await getHolidays());
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [name, setName] = useState(""); const [date, setDate] = useState(""); const [type, setType] = useState("public"); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setName(""); setDate(""); setType("public"); setOpen(true); };
  const openEdit = (h: Holiday) => { setEditId(h.id); setName(h.name); setDate(h.date.slice(0, 10)); setType(h.type); setOpen(true); };

  useEffect(() => { refresh().then(() => setLoading(false)); }, []);
  useRealtime("holidays", refresh);

  const exportCols = [{key:"name",label:"Name"},{key:"date",label:"Date"},{key:"type",label:"Type"}];

  return (
    <div>
      <PageHeader title="Holiday Management" subtitle="GCT holidays & observances" icon={<Sun className="h-6 w-6" />} />
      <div className="flex justify-end mb-4"><Button size="sm" variant="outline" className="rounded-xl mr-2" onClick={() => navigate("/import?module=holidays")}><Upload className="h-4 w-4 mr-1" /> Import</Button><Button size="sm" variant="outline" className="rounded-xl mr-2" onClick={() => exportToCsv(items, "holidays", exportCols)}><Download className="h-4 w-4 mr-1" /> Export</Button><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Holiday</Button></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Holidays</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Upcoming</p><p className="text-2xl font-bold">{items.filter((h) => new Date(h.date) >= new Date()).length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Past</p><p className="text-2xl font-bold">{items.filter((h) => new Date(h.date) < new Date()).length}</p></Card>
      </div>

      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Day</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No holidays added</TableCell></TableRow>}
          {[...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((h) => (
            <TableRow key={h.id}>
              <TableCell className="text-xs font-medium">{h.name}</TableCell>
              <TableCell className="text-xs">{new Date(h.date).toLocaleDateString()}</TableCell>
              <TableCell className="text-xs">{new Date(h.date).toLocaleDateString(undefined, { weekday: "long" })}</TableCell>
              <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{h.type}</Badge></TableCell>
              <TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openEdit(h)}><Pencil className="h-3 w-3" /></Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setDeleteId(h.id)}><Trash2 className="h-3 w-3" /></Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Holiday</AlertDialogTitle><AlertDialogDescription>This will permanently remove this holiday. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteHoliday(deleteId); await refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Holiday" : "Add Holiday"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="holidayName">Holiday Name</Label><Input id="holidayName" name="holidayName" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="holidayDate">Date</Label><Input id="holidayDate" name="holidayDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div><Label className="text-xs" htmlFor="holidayType">Type</Label><Select name="holidayType" value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="college">College</SelectItem><SelectItem value="religious">Religious</SelectItem><SelectItem value="national">National</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !date} onClick={async () => { if (editId) { await updateHoliday(editId, { name, date: new Date(date).toISOString(), type }); } else { await createHoliday({ name, date: new Date(date).toISOString(), type }); } await refresh(); setOpen(false); toast.success(editId ? "Updated" : "Added"); }}>{editId ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
