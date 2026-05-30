import { useEffect, useState } from "react";
import { CalendarClock, Plus, Pencil, Trash2, Download, Upload } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useRealtime } from "@/lib/use-realtime";
import { getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType, LEAVE_MASTER_KEY, type LeaveType } from "@/lib/leave-types";

export default function LeaveMaster() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LeaveType[]>([]); const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [name, setName] = useState(""); const [days, setDays] = useState(""); const [paid, setPaid] = useState(true); const [cf, setCf] = useState(false); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setName(""); setDays(""); setPaid(true); setCf(false); setOpen(true); };
  const openEdit = (l: LeaveType) => { setEditId(l.id); setName(l.name); setDays(String(l.days)); setPaid(l.paid); setCf(l.carry_forward); setOpen(true); };
  const refresh = async () => setItems(await getLeaveTypes());
  const pag = usePagination({ data: items, pageSize: 10 });

  useEffect(() => { refresh().then(() => setLoading(false)); }, []);
  useRealtime("leave_types", refresh);

  const exportCols = [{key:"name",label:"Leave Type"},{key:"days",label:"Max Days"},{key:"paid",label:"Paid"},{key:"carry_forward",label:"Carry Forward"}];

  return (
    <div>
      <PageHeader title="Leave Master" subtitle="Configure leave types & policies" icon={<CalendarClock className="h-6 w-6" />} />
      <div className="flex justify-end mb-4"><Button size="sm" variant="outline" className="rounded-xl mr-2" onClick={() => navigate("/import?module=leave-master")}><Upload className="h-4 w-4 mr-1" /> Import</Button><Button size="sm" variant="outline" className="rounded-xl mr-2" onClick={() => exportToCsv(items, "leave-master", exportCols)}><Download className="h-4 w-4 mr-1" /> Export</Button><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Leave Type</Button></div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">Leave Type</TableHead><TableHead className="text-xs">Max Days</TableHead><TableHead className="text-xs">Paid</TableHead><TableHead className="text-xs">Carry Forward</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No leave types configured</TableCell></TableRow>}
          {pag.pageData.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="text-xs font-medium">{l.name}</TableCell>
              <TableCell className="text-xs">{l.days}</TableCell>
              <TableCell><Badge className={`text-[9px] ${l.paid ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{l.paid ? "Yes" : "No"}</Badge></TableCell>
              <TableCell><Badge className={`text-[9px] ${l.carry_forward ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>{l.carry_forward ? "Yes" : "No"}</Badge></TableCell>
              <TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openEdit(l)}><Pencil className="h-3 w-3" /></Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setDeleteId(l.id)}><Trash2 className="h-3 w-3" /></Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Leave Type</AlertDialogTitle><AlertDialogDescription>This will permanently remove this leave type. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteLeaveType(deleteId); await refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Leave Type" : "Add Leave Type"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="leaveName">Leave Name</Label><Input id="leaveName" name="leaveName" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label className="text-xs" htmlFor="maxDays">Max Days Per Year</Label><Input id="maxDays" name="maxDays" type="number" value={days} onChange={(e) => setDays(e.target.value)} /></div>
            <div className="flex gap-4"><label className="flex items-center gap-2 text-xs"><input type="checkbox" id="paid" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Paid</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" id="carryForward" checked={cf} onChange={(e) => setCf(e.target.checked)} /> Carry Forward</label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !days} onClick={async () => { if (editId) { await updateLeaveType(editId, { name, days: Number(days), paid, carry_forward: cf }); } else { await createLeaveType({ name, days: Number(days), paid, carry_forward: cf }); } await refresh(); setOpen(false); toast.success(editId ? "Updated" : "Added"); }}>{editId ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
