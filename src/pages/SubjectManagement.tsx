import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { subjectsMgmtKey, getSubjects, createSubject, deleteSubject } from "@/lib/subject-mgmt";

export default function SubjectManagement() {
  const [items, setItems] = useState(() => getSubjects());
  const refresh = () => setItems(getSubjects());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [code, setCode] = useState(""); const [credits, setCredits] = useState("");

  const pag = usePagination({ data: items, pageSize: 10 });

  useEffect(() => subscribeAppSync([subjectsMgmtKey], refresh), []);

  return (
    <div>
      <PageHeader title="Subject Management" subtitle="Manage subjects & courses" icon={<BookOpen className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Subjects</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Active</p><p className="text-2xl font-bold">{items.length}</p></Card>
      </div>
      <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setCode(""); setCredits(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Subject</Button></div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">Subject</TableHead><TableHead className="text-xs">Code</TableHead><TableHead className="text-xs">Credits</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="text-xs font-medium">{s.name}</TableCell>
              <TableCell className="text-xs font-mono">{s.code}</TableCell>
              <TableCell className="text-xs">{s.credits}</TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { deleteSubject(s.id); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No subjects created</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Subject Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MATH101" /></div><div><Label className="text-xs">Credits</Label><Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !code} onClick={() => { createSubject({ name, code, class_id: "", teacher_id: "", credits: Number(credits) || 3 }); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
