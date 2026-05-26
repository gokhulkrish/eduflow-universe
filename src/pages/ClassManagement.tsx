import { useEffect, useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
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
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { subscribeAppSync } from "@/lib/app-sync";
import { classesMgmtKey, getClasses, createClass, deleteClass, GRADES, SECTIONS } from "@/lib/class-mgmt";

export default function ClassManagement() {
  const [items, setItems] = useState(() => getClasses());
  const refresh = () => setItems(getClasses());
  const [open, setOpen] = useState(false); const [program, setProgram] = useState(""); const [section, setSection] = useState(""); const [room, setRoom] = useState(""); const [capacity, setCapacity] = useState("");

  useEffect(() => subscribeAppSync([classesMgmtKey], refresh), []);

  const pag = usePagination({ data: items, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Cohort Management" subtitle="Manage cohorts, sections & rooms" icon={<Layers className="h-6 w-6" />} />
      <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setProgram(""); setSection(""); setRoom(""); setCapacity(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Cohort</Button></div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">Program</TableHead><TableHead className="text-xs">Section</TableHead><TableHead className="text-xs">Room</TableHead><TableHead className="text-xs">Capacity</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-xs font-medium">{c.grade}</TableCell>
              <TableCell className="text-xs">{c.section}</TableCell>
              <TableCell className="text-xs">{c.room || "—"}</TableCell>
              <TableCell className="text-xs">{c.capacity}</TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { deleteClass(c.id); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No cohorts created</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Cohort</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="program">Program</Label><Select name="program" value={program} onValueChange={setProgram}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs" htmlFor="section">Section</Label><Select name="section" value={section} onValueChange={setSection}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="room">Room</Label><Input id="room" name="room" value={room} onChange={(e) => setRoom(e.target.value)} /></div><div><Label className="text-xs" htmlFor="capacity">Capacity</Label><Input id="capacity" name="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!program || !section} onClick={() => { createClass({ grade: program, section, room, capacity: Number(capacity) || 40, teacher_id: "" }); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
