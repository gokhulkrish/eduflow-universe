import { useState } from "react";
import { NotebookPen, Plus, Loader2, CheckCircle, Clock, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAssignments, saveAssignment, deleteAssignment, getSubmissions, gradeSubmission, getClasses, getSubjects } from "@/lib/assignments";

export default function Assignments() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("assignments");
  const [cohortFilter, setCohortFilter] = useState("");

  const { data: classes } = useQuery({ queryKey: ["as-classes"], queryFn: getClasses });
  const { data: subjects } = useQuery({ queryKey: ["as-subjects"], queryFn: getSubjects });
  const { data: assignments } = useQuery({ queryKey: ["as-assignments", cohortFilter], queryFn: () => getAssignments(cohortFilter || undefined) });

  // ── Assignment Dialog ──
  const [asOpen, setAsOpen] = useState(false);
  const [asTitle, setAsTitle] = useState(""); const [asDesc, setAsDesc] = useState(""); const [asSubj, setAsSubj] = useState(""); const [asCohort, setAsCohort] = useState(""); const [asDue, setAsDue] = useState(""); const [asMax, setAsMax] = useState("100"); const [asEditId, setAsEditId] = useState<string | null>(null);

  const openAs = (a?: any) => {
    setAsEditId(a?.id ?? null); setAsTitle(a?.title ?? ""); setAsDesc(a?.description ?? ""); setAsSubj(a?.subject_id ?? ""); setAsCohort(a?.class_id ?? cohortFilter ?? ""); setAsDue(a?.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : ""); setAsMax(String(a?.max_marks ?? 100)); setAsOpen(true);
  };

  const saveAsMut = useMutation({
    mutationFn: () => saveAssignment(asEditId ? { id: asEditId, title: asTitle, description: asDesc || null, subject_id: asSubj, class_id: asCohort, due_date: asDue ? new Date(asDue).toISOString() : null, max_marks: Number(asMax), created_by: null, status: "active" } : { title: asTitle, description: asDesc || null, subject_id: asSubj, class_id: asCohort, due_date: asDue ? new Date(asDue).toISOString() : null, max_marks: Number(asMax), created_by: null, status: "active" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["as-assignments"] }); setAsOpen(false); toast.success(asEditId ? "Updated" : "Created"); },
    onError: (e) => toast.error(e.message),
  });

  const delAsMut = useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["as-assignments"] }); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Submissions / Grading ──
  const [selectedAs, setSelectedAs] = useState<string | null>(null);
  const { data: submissions } = useQuery({ queryKey: ["as-submissions", selectedAs], queryFn: () => getSubmissions(selectedAs!), enabled: !!selectedAs });

  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [gradeMarks, setGradeMarks] = useState(""); const [gradeFeedback, setGradeFeedback] = useState("");

  const gradeMut = useMutation({
    mutationFn: () => gradeSubmission(submissionId!, Number(gradeMarks), gradeFeedback),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["as-submissions"] }); qc.invalidateQueries({ queryKey: ["as-assignments"] }); setSubmissionId(null); toast.success("Graded"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Assignments & Homework" subtitle="Create, submit & grade" icon={<NotebookPen className="h-6 w-6" />} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex gap-2">
              <Select value={cohortFilter} onValueChange={(v) => setCohortFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All cohorts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cohorts</SelectItem>
                  {(classes ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.grade}{c.section ? `-${c.section}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => openAs()}><Plus className="h-4 w-4 mr-1" /> New Assignment</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(assignments ?? []).map((a) => (
              <Card key={a.id} className="border-border/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{a.title}</CardTitle>
                    <Badge className={`text-[10px] ${a.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{a.status}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{a.subject_name} · {a.grade}{a.section ? `-${a.section}` : ""}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {a.description && <p className="text-muted-foreground line-clamp-2">{a.description}</p>}
                  <div className="flex justify-between text-muted-foreground">
                    <span><Clock className="h-3 w-3 inline mr-1" />{a.due_date ? new Date(a.due_date).toLocaleDateString() : "No due date"}</span>
                    <span>Max: {a.max_marks}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{a.submission_count ?? 0} submitted</span>
                    <span className="text-success">{a.graded_count ?? 0} graded</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => { setSelectedAs(a.id); setTab("submissions"); }}><FileText className="h-3 w-3 mr-1" /> View</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => openAs(a)}>Edit</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { if (confirm("Delete?")) delAsMut.mutate(a.id); }} disabled={delAsMut.isPending}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Select value={selectedAs ?? ""} onValueChange={(v) => setSelectedAs(v)}>
              <SelectTrigger className="h-8 text-xs w-64"><SelectValue placeholder="Select assignment" /></SelectTrigger>
              <SelectContent>{(assignments ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.title} ({a.grade}{a.section})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selectedAs && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Submissions · {(assignments ?? []).find((a) => a.id === selectedAs)?.title}</CardTitle></CardHeader>
              <CardContent>
                <Table>
              <TableHeader className="sticky top-[7.5rem] z-20 bg-background/95 backdrop-blur">
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Submitted</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Marks</TableHead>
                  <TableHead className="text-xs">Feedback</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
                  <TableBody>
                    {(submissions ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No submissions yet</TableCell></TableRow>}
                    {(submissions ?? []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm font-medium">{s.student_name ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleString()}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${s.status === "graded" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{s.status}</Badge></TableCell>
                        <TableCell className="text-right text-sm font-semibold">{s.marks !== null ? `${s.marks}${assignments?.find((a) => a.id === s.assignment_id) ? `/${assignments.find((a) => a.id === s.assignment_id)!.max_marks}` : ""}` : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{s.feedback ?? "—"}</TableCell>
                        <TableCell>
                          {s.status !== "graded" && (
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => { setSubmissionId(s.id); setGradeMarks(""); setGradeFeedback(""); }}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Grade
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ══════ ASSIGNMENT DIALOG ══════ */}
      <Dialog open={asOpen} onOpenChange={setAsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{asEditId ? "Edit" : "New"} Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Title</Label><Input value={asTitle} onChange={(e) => setAsTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Subject</Label><Select value={asSubj} onValueChange={setAsSubj}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(subjects ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Cohort</Label><Select value={asCohort} onValueChange={setAsCohort}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(classes ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.grade}{c.section ? `-${c.section}` : ""}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={asDesc} onChange={(e) => setAsDesc(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Due Date</Label><Input type="datetime-local" value={asDue} onChange={(e) => setAsDue(e.target.value)} /></div>
              <div><Label className="text-xs">Max Marks</Label><Input type="number" value={asMax} onChange={(e) => setAsMax(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsOpen(false)}>Cancel</Button>
            <Button onClick={() => saveAsMut.mutate()} disabled={!asTitle || !asSubj || !asCohort || saveAsMut.isPending}>{saveAsMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{asEditId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ GRADE DIALOG ══════ */}
      <Dialog open={!!submissionId} onOpenChange={(o) => { if (!o) setSubmissionId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Grade Submission</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Marks</Label><Input type="number" value={gradeMarks} onChange={(e) => setGradeMarks(e.target.value)} placeholder="0" /></div>
            <div><Label className="text-xs">Feedback</Label><Textarea value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmissionId(null)}>Cancel</Button>
            <Button onClick={() => gradeMut.mutate()} disabled={gradeMarks === "" || gradeMut.isPending}>{gradeMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Submit Grade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
