import { useState } from "react";
import { GraduationCap, Plus, Play, History, Trash2, Users, Hash, Eye, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import {
  usePromotionRules,
  useSavePromotionRule,
  useDeletePromotionRule,
  usePromotionRuns,
  useCheckEligibility,
  useExecutePromotion,
} from "@/hooks/usePromotion";
import { DEFAULT_GRADES, DEFAULT_SECTIONS, nextGrade, generateRollNumbers, reallocateSections } from "../../core/academics/promotion";

export default function PromotionEngine() {
  const [tab, setTab] = useState("rules");
  const [preview, setPreview] = useState<any[]>([]);
  const [rolls, setRolls] = useState<string[]>([]);
  const [sectionAlloc, setSectionAlloc] = useState<Record<string, string[]> | null>(null);

  const { data: rules = [], isLoading: rulesLoading } = usePromotionRules();
  const { data: runs = [], isLoading: runsLoading } = usePromotionRuns();
  const saveRule = useSavePromotionRule();
  const deleteRule = useDeletePromotionRule();
  const checkEligibility = useCheckEligibility();
  const executePromo = useExecutePromotion();

  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState(""); const [fromProgram, setFromProgram] = useState(""); const [toProgram, setToProgram] = useState(""); const [fromSec, setFromSec] = useState(""); const [toSec, setToSec] = useState(""); const [minAtt, setMinAtt] = useState("75"); const [minGpa, setMinGpa] = useState("2.0"); const [auto, setAuto] = useState(false); const [resetRoll, setResetRoll] = useState(false);

  const handleProgramChange = (g: string) => { setFromProgram(g); setToProgram(nextGrade(g, DEFAULT_GRADES)); };

  const openEdit = (r?: any) => {
    const c = r?.criteria ?? {};
    setEditId(r?.id ?? null); setName(r?.name ?? ""); setFromProgram(c?.from_grade ?? ""); setToProgram(c?.to_grade ?? ""); setFromSec(c?.from_section ?? ""); setToSec(c?.to_section ?? ""); setMinAtt(String(c?.min_attendance ?? 75)); setMinGpa(String(c?.min_gpa ?? 2.0)); setAuto(c?.auto_promote ?? false); setResetRoll(c?.reset_roll ?? false); setOpen(true);
  };

  const handleRun = async (r: any) => {
    try {
      const eligible = await checkEligibility.mutateAsync(r);
      if (eligible.length === 0) { toast.error("No eligible students"); return; }
      const result = await executePromo.mutateAsync({ rule: r, eligible });
      toast.success(`Promotion complete: ${result.promoted_count} promoted, ${result.total_eligible - result.promoted_count} failed`);
    } catch (err: any) {
      toast.error(err?.message || "Promotion failed");
    }
  };

  const handlePreview = async (r: any) => {
    try {
      const eligible = await checkEligibility.mutateAsync(r);
      setPreview(eligible);
      toast.success(`${eligible.filter((s) => s.eligible).length} eligible out of ${eligible.length}`);
      setTab("preview");
    } catch (err: any) {
      toast.error(err?.message || "Preview failed");
    }
  };

  const handleSaveRule = async () => {
    try {
      const payload: any = {
        name,
        institution_id: "",
        criteria: { from_grade: fromProgram, to_grade: toProgram, from_section: fromSec || null, to_section: toSec || null, min_attendance: Number(minAtt), min_gpa: Number(minGpa), auto_promote: auto, reset_roll: resetRoll, status: "active", academic_year_id: null },
      };
      if (editId) payload.id = editId;
      await saveRule.mutateAsync(payload);
      setOpen(false);
      toast.success(editId ? "Updated" : "Created");
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const pag1 = usePagination({ data: preview, pageSize: 10 });
  const pag2 = usePagination({ data: runs, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Cohort Progression Engine" subtitle="Rules, eligibility preview, and bulk promotion" icon={<GraduationCap className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="rolls">Roll Numbers</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setFromProgram(""); setToProgram(""); setFromSec(""); setToSec(""); setMinAtt("75"); setMinGpa("2.0"); setAuto(false); setResetRoll(false); setEditId(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Rule</Button></div>
          {rulesLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rules.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No promotion rules. Create one to get started.</CardContent></Card>}
            {rules.map((r: any) => (
              <Card key={r.id} className="border-border/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between"><CardTitle className="text-sm">{r.name}</CardTitle><Badge className={`text-[9px] ${r.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{r.status}</Badge></div>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p><strong>Cohort:</strong> {r.criteria?.from_grade}{r.criteria?.from_section ? `-${r.criteria?.from_section}` : ""} &rarr; {r.criteria?.to_grade}{r.criteria?.to_section ? `-${r.criteria?.to_section}` : ""}</p>
                  <p className="text-muted-foreground">Min attendance: {r.criteria?.min_attendance}% &middot; Min GPA: {r.criteria?.min_gpa}</p>
                  <p className="text-muted-foreground">Auto: {r.criteria?.auto_promote ? "Yes" : "No"} &middot; Reset roll: {r.criteria?.reset_roll ? "Yes" : "No"}</p>
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => openEdit(r)}>Edit</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => handlePreview(r)} disabled={checkEligibility.isPending}><Eye className="h-3 w-3 mr-1" />Preview</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => handleRun(r)} disabled={executePromo.isPending}><Play className="h-3 w-3 mr-1" />Run</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => handleDeleteRule(r.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader><CardTitle className="text-sm">Eligibility Preview</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pag1} />
              <Table>
              <TableHeader>
                <TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Grade</TableHead><TableHead className="text-xs">Attendance</TableHead><TableHead className="text-xs">GPA</TableHead><TableHead className="text-xs">Eligible</TableHead></TableRow>
              </TableHeader>
                <TableBody>
                  {preview.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">Select a rule and click Preview</TableCell></TableRow>}
                  {pag1.pageData.map((s: any) => (
                    <TableRow key={s.student_id}>
                      <TableCell className="text-xs">{s.display_name}</TableCell>
                      <TableCell className="text-xs">{s.grade}-{s.section}</TableCell>
                      <TableCell className="text-xs">{s.attendance_percent}%</TableCell>
                      <TableCell className="text-xs">{s.gpa}</TableCell>
                      <TableCell>{s.eligible ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <Card>
            <CardHeader><CardTitle className="text-sm">Section Reallocation</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {DEFAULT_SECTIONS.map((s) => (
                  <Button key={s} variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => {
                    const dummy = Array.from({ length: 40 }, (_, i) => `Student ${i + 1}`);
                    const alloc = reallocateSections(dummy, DEFAULT_SECTIONS);
                    setSectionAlloc(alloc);
                    toast.success(`${DEFAULT_SECTIONS.length} sections populated`);
                  }}>Reallocate {s}</Button>
                ))}
              </div>
              {sectionAlloc && Object.entries(sectionAlloc).map(([sec, students]) => (
                <div key={sec} className="mb-3">
                  <p className="text-xs font-medium mb-1">Section {sec} ({students.length} students)</p>
                  <div className="flex flex-wrap gap-1">
                    {students.map((s, i) => <Badge key={i} className="text-[9px] bg-muted text-muted-foreground">{s}</Badge>)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rolls">
          <Card>
            <CardHeader><CardTitle className="text-sm">Roll Number Reset</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Generate new roll numbers for promoted students with a custom prefix.</p>
              <div className="flex gap-2">
                <Input placeholder="Prefix (e.g. 2026-A)" className="max-w-[200px] h-8 text-xs" id="roll-prefix" />
                <Button variant="outline" size="sm" className="rounded-lg h-8 text-[10px]" onClick={() => {
                  const prefix = (document.getElementById("roll-prefix") as HTMLInputElement)?.value || "STU";
                  const generated = generateRollNumbers(40, prefix);
                  setRolls(generated);
                  toast.success(`${generated.length} roll numbers generated`);
                }}><Hash className="h-3 w-3 mr-1" />Generate</Button>
              </div>
              {rolls.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rolls.map((r, i) => <Badge key={i} className="text-[9px] bg-muted text-muted-foreground font-mono">{r}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {runsLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
          <>
          <TablePagination {...pag2} />
          <Table>
            <TableHeader>
              <TableRow><TableHead className="text-xs">Rule</TableHead><TableHead className="text-xs">Promoted</TableHead><TableHead className="text-xs">Failed</TableHead><TableHead className="text-xs">Total</TableHead><TableHead className="text-xs">Run At</TableHead><TableHead className="text-xs">Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No runs yet</TableCell></TableRow>}
              {pag2.pageData.map((rn: any) => (
                <TableRow key={rn.id}>
                  <TableCell className="text-xs">{rn.name}</TableCell>
                  <TableCell className="text-xs text-success">{rn.promoted}</TableCell>
                  <TableCell className="text-xs text-destructive">{rn.failed}</TableCell>
                  <TableCell className="text-xs">{rn.total}</TableCell>
                  <TableCell className="text-xs">{new Date(rn.run_at).toLocaleString()}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-success/15 text-success">{rn.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Promotion Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Rule Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Primary Promotion 2026" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">From Cohort</Label><Select value={fromProgram} onValueChange={handleProgramChange}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{DEFAULT_GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">To Cohort</Label><Select value={toProgram} onValueChange={setToProgram}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{DEFAULT_GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">From Section</Label><Select value={fromSec} onValueChange={setFromSec}><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger><SelectContent>{DEFAULT_SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">To Section</Label><Select value={toSec} onValueChange={setToSec}><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger><SelectContent>{DEFAULT_SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Min Attendance %</Label><Input type="number" value={minAtt} onChange={(e) => setMinAtt(e.target.value)} /></div>
              <div><Label className="text-xs">Min GPA</Label><Input type="number" step="0.1" value={minGpa} onChange={(e) => setMinGpa(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={auto} onCheckedChange={setAuto} id="auto" /><Label htmlFor="auto" className="text-xs">Auto-promote</Label></div>
              <div className="flex items-center gap-2"><Switch checked={resetRoll} onCheckedChange={setResetRoll} id="resetRoll" /><Label htmlFor="resetRoll" className="text-xs">Reset roll #</Label></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSaveRule} disabled={!name || !fromProgram || !toProgram || saveRule.isPending}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
