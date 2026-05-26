import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

type LeaveType = { id: string; name: string; days: number; paid: boolean; carry_forward: boolean; };
const LEAVE_MASTER_KEY = "eduflow_leave_master";
function ls(): LeaveType[] { try { return JSON.parse(localStorage.getItem(LEAVE_MASTER_KEY) ?? "[]"); } catch { return []; } }
function ss(v: LeaveType[]) { localStorage.setItem(LEAVE_MASTER_KEY, JSON.stringify(v)); emitAppSync(LEAVE_MASTER_KEY); }

export default function LeaveMaster() {
  const [items, setItems] = useState(ls());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [days, setDays] = useState(""); const [paid, setPaid] = useState(true); const [cf, setCf] = useState(false);
  const refresh = () => setItems(ls());
  const pag = usePagination({ data: items, pageSize: 10 });

  useEffect(() => subscribeAppSync([LEAVE_MASTER_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Leave Master" subtitle="Configure leave types & policies" icon={<CalendarClock className="h-6 w-6" />} />
      <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setDays(""); setPaid(true); setCf(false); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Leave Type</Button></div>
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
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== l.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Leave Type</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="leaveName">Leave Name</Label><Input id="leaveName" name="leaveName" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label className="text-xs" htmlFor="maxDays">Max Days Per Year</Label><Input id="maxDays" name="maxDays" type="number" value={days} onChange={(e) => setDays(e.target.value)} /></div>
            <div className="flex gap-4"><label className="flex items-center gap-2 text-xs"><input type="checkbox" id="paid" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Paid</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" id="carryForward" checked={cf} onChange={(e) => setCf(e.target.checked)} /> Carry Forward</label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !days} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), name, days: Number(days), paid, carry_forward: cf }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
