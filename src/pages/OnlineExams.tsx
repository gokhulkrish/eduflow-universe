import { useEffect, useState } from "react";
import { FileSignature, Plus, Loader2, Clock, Trash2, BarChart3, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
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
import { subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { onlineExamTestsKey, onlineExamResultsKey, getLocalTests, saveLocalTest, deleteLocalTest, getResults, gradeAttempt, getResultAnalytics, getQuestionBanks, getClasses, getSubjects } from "@/lib/online-exams";
import { isModuleEnabled } from "@/lib/module-access";

export default function OnlineExams() {
  const [tab, setTab] = useState("tests");
  const { data: examsEnabled } = useQuery({ queryKey: ["module-enabled", "exams"], queryFn: () => isModuleEnabled("exams"), staleTime: Infinity });
  const { data: subjects } = useQuery({ queryKey: ["oe-subjects"], queryFn: getSubjects });
  const { data: classes } = useQuery({ queryKey: ["oe-classes"], queryFn: getClasses });
  const { data: qbanks } = useQuery({ queryKey: ["oe-qbanks"], queryFn: () => getQuestionBanks(), enabled: examsEnabled === true });
  const [tests, setTests] = useState(() => getLocalTests());
  const [results, setResults] = useState(() => getResults());
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsTestId, setAnalyticsTestId] = useState<string | null>(null);
  const refresh = () => { setTests(getLocalTests()); setResults(getResults()); };

  const pag1 = usePagination({ data: results, pageSize: 10 });
  const pag2 = usePagination({ data: qbanks ?? [], pageSize: 10 });

  useEffect(() => subscribeAppSync([onlineExamTestsKey, onlineExamResultsKey], () => {
    refresh();
    if (analyticsTestId) setAnalytics(getResultAnalytics(analyticsTestId));
  }), [analyticsTestId]);

  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [subjId, setSubjId] = useState(""); const [cohortId, setCohortId] = useState(""); const [duration, setDuration] = useState("60"); const [maxMarks, setMaxMarks] = useState("100"); const [passMarks, setPassMarks] = useState("35");

  const openEdit = (t?: any) => {
    setEditId(t?.id ?? null); setTitle(t?.title ?? ""); setDesc(t?.description ?? ""); setSubjId(t?.subject_id ?? ""); setCohortId(t?.class_id ?? ""); setDuration(String(t?.duration_minutes ?? 60)); setMaxMarks(String(t?.max_marks ?? 100)); setPassMarks(String(t?.pass_marks ?? 35)); setOpen(true);
  };

  const handleSave = () => {
    saveLocalTest(editId ? { id: editId, title, description: desc || null, subject_id: subjId, class_id: cohortId, duration_minutes: Number(duration), max_marks: Number(maxMarks), pass_marks: Number(passMarks), status: "published", shuffle_questions: false } : { title, description: desc || null, subject_id: subjId, class_id: cohortId, duration_minutes: Number(duration), max_marks: Number(maxMarks), pass_marks: Number(passMarks), status: "published", shuffle_questions: false, created_by: null });
    refresh(); setOpen(false); toast.success(editId ? "Updated" : "Created");
  };

  const handleAutoGrade = (testId: string) => {
    const dummyQs = (qbanks ?? []).slice(0, 5);
    if (dummyQs.length === 0) { toast.error("No questions in bank to grade against"); return; }
    const answers = dummyQs.map((q: any) => ({
      question_id: q.id, answer: q.correct_answer || "sample answer", correct_answer: q.correct_answer || "sample answer", marks: q.marks || 5
    }));
    const t = gradeAttempt(testId, `stu_${Date.now()}`, answers);
    refresh();
    setAnalytics(getResultAnalytics(testId));
    toast.success(`Graded: ${t.score}/${t.total} (${t.percentage}%)`);
  };

  const showAnalytics = (testId: string) => {
    setAnalyticsTestId(testId);
    setAnalytics(getResultAnalytics(testId));
    setTab("analytics");
  };

  return (
    <div>
      <PageHeader title="Online Exams" subtitle="Create, auto-grade & analyze results" icon={<FileSignature className="h-6 w-6" />} />
      {examsEnabled === false && (
        <Card className="mb-4 border-dashed border-warning/40 bg-warning/5 p-4 text-sm text-muted-foreground">
          The exams module is not installed in the connected Supabase project yet, so the question bank is disabled until the Wave 7 migration is applied.
        </Card>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="questions">Question Bank</TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => openEdit()}><Plus className="h-4 w-4 mr-1" /> New Test</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tests.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No tests created</CardContent></Card>}
            {tests.map((t: any) => (
              <Card key={t.id} className="border-border/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between"><CardTitle className="text-sm">{t.title}</CardTitle><Badge className="text-[10px] bg-success/15 text-success">{t.status}</Badge></div>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <p className="text-muted-foreground">{t.description ?? "—"}</p>
                  <div className="flex gap-3 text-muted-foreground"><span><Clock className="h-3 w-3 inline mr-1" />{t.duration_minutes}m</span><span>{t.max_marks} marks</span></div>
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => openEdit(t)}>Edit</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => handleAutoGrade(t.id)}><GraduationCap className="h-3 w-3 mr-1" />Auto-Grade</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => showAnalytics(t.id)}><BarChart3 className="h-3 w-3 mr-1" />Analytics</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { deleteLocalTest(t.id); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results">
          <TablePagination {...pag1} />
          <Table>
            <TableHeader className="">
              <TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Test</TableHead><TableHead className="text-xs">Score</TableHead><TableHead className="text-xs">Percentage</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Submitted</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No results yet — run Auto-Grade on a test</TableCell></TableRow>}
              {pag1.pageData.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.student_name}</TableCell>
                  <TableCell className="text-xs">{(tests.find((t: any) => t.id === r.test_id)?.title ?? "—")}</TableCell>
                  <TableCell className="text-xs">{r.score}/{r.total}</TableCell>
                  <TableCell className="text-xs">{r.percentage}%</TableCell>
                  <TableCell><Badge className={`text-[9px] ${r.status === "passed" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs">{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="analytics">
          {analytics ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Pass Rate</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-success">{analytics.passRate}%</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Average Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{analytics.avgPct}%</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Total Attempts</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{analytics.total}</p></CardContent></Card>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Passed</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-success">{analytics.passed}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Failed</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-destructive">{analytics.failed}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Highest / Lowest</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{analytics.highest}% / {analytics.lowest}%</p></CardContent></Card>
              </div>
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Select a test and click Analytics to view results</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader><CardTitle className="text-sm">Question Bank ({qbanks?.length ?? 0} questions)</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pag2} />
              <Table>
              <TableHeader className="">
                <TableRow><TableHead className="text-xs">Question</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Difficulty</TableHead><TableHead className="text-xs">Subject</TableHead><TableHead className="text-xs text-right">Marks</TableHead></TableRow>
              </TableHeader>
                <TableBody>
                  {(qbanks ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No questions in bank</TableCell></TableRow>}
                  {pag2.pageData.map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-xs max-w-[200px] truncate">{q.question_text}</TableCell>
                      <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{q.question_type}</Badge></TableCell>
                      <TableCell className="text-xs">{q.difficulty ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{(subjects ?? []).find((s: any) => s.id === q.subject_id)?.name ?? "—"}</TableCell>
                      <TableCell className="text-right text-xs">{q.marks ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Test</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="examTitle">Title</Label><Input id="examTitle" name="examTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs" htmlFor="examDesc">Description</Label><Textarea id="examDesc" name="examDesc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" htmlFor="examSubject">Subject</Label><Select name="examSubject" value={subjId} onValueChange={setSubjId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(subjects ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs" htmlFor="examCohort">Cohort</Label><Select name="examCohort" value={cohortId} onValueChange={setCohortId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(classes ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.grade}{c.section ? `-${c.section}` : ""}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs" htmlFor="examDuration">Duration</Label><Input id="examDuration" name="examDuration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="examMaxMarks">Max Marks</Label><Input id="examMaxMarks" name="examMaxMarks" type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="examPassMarks">Pass Marks</Label><Input id="examPassMarks" name="examPassMarks" type="number" value={passMarks} onChange={(e) => setPassMarks(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!title || !subjId || !cohortId}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
