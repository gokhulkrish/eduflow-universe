import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import {
  FileBarChart, Plus, Search, Save, X, CheckCircle2, AlertTriangle,
  Loader2, Calendar, BookOpen, Users, GraduationCap, BarChart3,
  Edit3, Trash2, Eye, HelpCircle, Download, Printer, Mail, ShieldCheck, ShieldX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/PageHeader";
import { StickyActionBar } from "@/components/StickyActionBar";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchStudentRegister } from "@/lib/student-records";
import { isModuleEnabled } from "@/lib/module-access";
import {
  getExamSchedules, saveExamSchedule, deleteExamSchedule, updateExamStatus,
  getMarksForExam, saveExamMarks, approveMarks, rejectExamMarks,
  calculateGrade, getGradeDistribution, getPassFailStats,
  calculateGPA,
  fetchSubjects, fetchGradeOptions,
  getQuestions, saveQuestion, deleteQuestion,
  publishResult, getPublicationForExam, getPublicationsForExams,
  getTranscripts, issueTranscript,
  EXAM_TYPES, DIFFICULTIES, QUESTION_TYPES,
  type ExamSchedule, type ExamMark, type ExamStatus,
  type ExamType, type QuestionBank, type Difficulty, type QuestionType,
  type Transcript,
} from "@/lib/exams";

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};
const diffColor: Record<string, string> = {
  easy: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  hard: "bg-destructive/15 text-destructive",
};
const emptySchedule = () => ({
  title: "", exam_type: "unit_test" as ExamType, grade: "", section: "A",
  subject: "", subject_id: null as string | null, max_marks: 100, pass_marks: 35,
  date: new Date().toISOString().slice(0, 10),
  start_time: "09:00", end_time: "10:30", description: "", status: "draft" as ExamStatus,
});
const emptyQuestion = () => ({
  subject_id: "", grade: "", topic: "", difficulty: "medium" as Difficulty,
  question_type: "mcq" as QuestionType, question_text: "",
  options: null as Record<string, string> | null, correct_answer: "",
  marks: 1, explanation: null as string | null,
});

export default function Exams() {
  const qc = useQueryClient();
  const { data: examsEnabled } = useQuery({
    queryKey: ["module-enabled", "exams"],
    queryFn: () => isModuleEnabled("exams"),
    staleTime: Infinity,
  });
  const [tab, setTab] = useState("schedules");
  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState("all");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ExamSchedule | null>(null);
  const [draft, setDraft] = useState(emptySchedule());

  const [markEntryExam, setMarkEntryExam] = useState<ExamSchedule | null>(null);
  const [markValues, setMarkValues] = useState<Record<string, string>>({});

  const [questionOpen, setQuestionOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<QuestionBank | null>(null);
  const [qDraft, setQDraft] = useState(emptyQuestion());
  const [qSearch, setQSearch] = useState("");
  const [qSubjectFilter, setQSubjectFilter] = useState("all");
  const [qDiffFilter, setQDiffFilter] = useState<Difficulty | "all">("all");

  const [publishExam, setPublishExam] = useState<ExamSchedule | null>(null);
  const [publishNotifyStudents, setPublishNotifyStudents] = useState(true);
  const [publishNotifyParents, setPublishNotifyParents] = useState(false);

  const [transcriptStudentFilter, setTranscriptStudentFilter] = useState("all");
  const [transcriptYearFilter, setTranscriptYearFilter] = useState("all");
  const [issueTranscriptOpen, setIssueTranscriptOpen] = useState(false);
  const [issueStudentId, setIssueStudentId] = useState("");
  const [issueYear, setIssueYear] = useState("2025-26");
  const [issueExamIds, setIssueExamIds] = useState<string[]>([]);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [gpExpanded, setGpExpanded] = useState(false);
  const [rankOpen, setRankOpen] = useState<Record<string, boolean>>({});

  async function generateTranscriptPDF(t: Transcript) {
    setPdfLoading(t.id);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");
      const QRCode = (await import("qrcode")).default;

      const student = students.find((s) => s.id === t.student_id);
      if (!student) return;

    const qrDataUrl = await QRCode.toDataURL(t.qr_token ?? t.id, { width: 120, margin: 1 });

    const container = document.createElement("div");
    container.id = "transcript-pdf";
    container.style.cssText = "width:800px;padding:40px;font-family:Inter,sans-serif;background:#fff;color:#000;";
    container.innerHTML = `
      <div style="text-align:center;border-bottom:2px solid #1a73e8;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="font-size:22px;font-weight:700;margin:0;color:#1a73e8;">Academic Transcript</h1>
        <p style="font-size:13px;color:#555;margin:4px 0 0;">${student.display_name} · ${student.admission_no}</p>
      </div>
      <table style="width:100%;font-size:13px;margin-bottom:16px;">
        <tr><td style="padding:4px 8px;color:#555;">Student</td><td style="padding:4px 8px;font-weight:600;">${student.display_name}</td>
            <td style="padding:4px 8px;color:#555;">Year</td><td style="padding:4px 8px;font-weight:600;">${t.academic_year}</td></tr>
        <tr><td style="padding:4px 8px;color:#555;">Grade/Section</td><td style="padding:4px 8px;font-weight:600;">${student.grade ?? "—"}</td>
            <td style="padding:4px 8px;color:#555;">Issued</td><td style="padding:4px 8px;font-weight:600;">${t.issued_at ? new Date(t.issued_at).toLocaleDateString() : "—"}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <thead><tr style="background:#f0f4ff;">
          <th style="padding:8px;text-align:left;border:1px solid #ddd;">Metric</th>
          <th style="padding:8px;text-align:center;border:1px solid #ddd;">Total Marks</th>
          <th style="padding:8px;text-align:center;border:1px solid #ddd;">Obtained</th>
          <th style="padding:8px;text-align:center;border:1px solid #ddd;">Percentage</th>
          <th style="padding:8px;text-align:center;border:1px solid #ddd;">GPA</th>
          <th style="padding:8px;text-align:center;border:1px solid #ddd;">Grade</th>
        </tr></thead>
        <tbody><tr>
          <td style="padding:8px;border:1px solid #ddd;font-weight:600;">Overall</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${t.total_marks ?? "—"}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${t.obtained_marks ?? "—"}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${t.percentage !== null ? t.percentage + "%" : "—"}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${t.gpa !== null ? t.gpa.toFixed(2) : "—"}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:700;">${calculateGrade(t.percentage)}</td>
        </tr></tbody>
      </table>
      <div style="display:flex;align-items:center;gap:16px;padding-top:12px;border-top:1px solid #ddd;">
        <img src="${qrDataUrl}" style="width:80px;height:80px;" alt="QR" />
        <div style="font-size:11px;color:#888;">
          <p style="margin:0 0 4px;">Verification token: ${(t.qr_token ?? t.id).slice(0, 16)}...</p>
          <p style="margin:0;">Digitally issued by EduFlow SMS</p>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    document.body.removeChild(container);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = 190;
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 10, pdfW, pdfH);
    pdf.save(`transcript-${student.display_name.replace(/\s+/g, "_")}.pdf`);
    } finally { setPdfLoading(null); }
  }

  // ── Data queries ──
  const studentsQuery = useQuery({
    queryKey: ["student-register", "exams"],
    queryFn: fetchStudentRegister,
    staleTime: 60_000,
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    staleTime: 5 * 60_000,
  });
  const schedulesQuery = useQuery({
    queryKey: ["exam-schedules"],
    queryFn: getExamSchedules,
    enabled: examsEnabled === true,
  });
  const questionsQuery = useQuery({
    queryKey: ["question-banks", qSubjectFilter, qDiffFilter],
    queryFn: () => getQuestions({
      ...(qSubjectFilter !== "all" ? { subject_id: qSubjectFilter } : {}),
      ...(qDiffFilter !== "all" ? { difficulty: qDiffFilter } : {}),
    }),
    enabled: examsEnabled === true,
  });
  const transcriptsQuery = useQuery({
    queryKey: ["transcripts", transcriptStudentFilter, transcriptYearFilter],
    queryFn: () => getTranscripts({
      ...(transcriptStudentFilter !== "all" ? { student_id: transcriptStudentFilter } : {}),
      ...(transcriptYearFilter !== "all" ? { academic_year: transcriptYearFilter } : {}),
    }),
    enabled: examsEnabled === true,
  });

  // ── Batch marks query: fetch marks for all schedules that will be displayed ──
  const students = studentsQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const questions = questionsQuery.data ?? [];
  const transcripts = transcriptsQuery.data ?? [];

  const cohortOptions = useMemo(
    () => [...new Set(students.map((r) => r.grade).filter((g): g is string => g !== null))].sort(),
    [students],
  );

  const filteredSchedules = useMemo(() => {
    let r = schedules;
    if (cohortFilter !== "all") r = r.filter((s) => s.grade === cohortFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter((s) => s.title.toLowerCase().includes(q) || s.subject.toLowerCase().includes(q));
    }
    return r;
  }, [schedules, cohortFilter, search]);

  const completedSchedules = useMemo(
    () => schedules.filter((s) => s.status === "completed" || s.status === "published"),
    [schedules],
  );

  // Prune stale rankOpen keys when completed exams change
  useEffect(() => {
    const ids = new Set(completedSchedules.map((s) => s.id));
    setRankOpen((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => ids.has(k))));
  }, [completedSchedules]);

  // Fetch marks for all displayed schedules (prevent hooks-in-loop)
  const scheduleIds = useMemo(() => filteredSchedules.map((s) => s.id), [filteredSchedules]);
  const completedIds = useMemo(() => completedSchedules.map((s) => s.id), [completedSchedules]);
  const allVisibleIds = useMemo(
    () => [...new Set([...scheduleIds, ...completedIds, ...(markEntryExam ? [markEntryExam.id] : [])])],
    [scheduleIds, completedIds, markEntryExam],
  );

  const marksQueries = useQueries({
    queries: allVisibleIds.map((id) => ({
      queryKey: ["exam-marks", id],
      queryFn: () => getMarksForExam(id),
      staleTime: 30_000,
      enabled: examsEnabled === true,
    })),
  });
  const marksByExam = useMemo(() => {
    const map = new Map<string, ExamMark[]>();
    for (let i = 0; i < allVisibleIds.length; i++) {
      map.set(allVisibleIds[i], marksQueries[i]?.data ?? []);
    }
    return map;
  }, [allVisibleIds, marksQueries]);

  // Roster for mark entry
  const roster = useMemo(() => {
    if (!markEntryExam) return [];
    return students.filter(
      (s) => s.grade === markEntryExam.grade && (s.section ?? "A") === markEntryExam.section,
    );
  }, [markEntryExam, students]);

  // Per-schedule student count for progress bars
  const rosterSizeBySchedule = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of schedules) {
      map.set(s.id, students.filter(
        (st) => st.grade === s.grade && (st.section ?? "A") === s.section,
      ).length);
    }
    return map;
  }, [schedules, students]);

  // Fetch publications for completed/published schedules
  const { data: publicationsMap } = useQuery({
    queryKey: ["exam-publications", ...completedIds],
    queryFn: () => getPublicationsForExams(completedIds),
    enabled: completedIds.length > 0 && examsEnabled === true,
    staleTime: 30_000,
  });

  // ── Mutations ──
  const saveScheduleMut = useMutation({
    mutationFn: (s: Parameters<typeof saveExamSchedule>[0]) => saveExamSchedule(s),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["exam-schedules"] });
      toast.success(editing ? `Updated "${saved.title}"` : `Created "${saved.title}"`);
      setEditOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteScheduleMut = useMutation({
    mutationFn: (id: string) => deleteExamSchedule(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-schedules"] }); toast.success("Deleted schedule"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveMarksMut = useMutation({
    mutationFn: (m: Parameters<typeof saveExamMarks>[0]) => saveExamMarks(m),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-marks"] }); toast.success("Marks saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const approveMarksMut = useMutation({
    mutationFn: ({ examId, studentIds }: { examId: string; studentIds: string[] }) => approveMarks(examId, studentIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-marks"] }); toast.success("Marks approved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rejectMarksMut = useMutation({
    mutationFn: ({ examId, studentIds, remarks }: { examId: string; studentIds: string[]; remarks?: string }) =>
      rejectExamMarks(examId, studentIds, remarks),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-marks"] }); toast.success("Marks rejected"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveQuestionMut = useMutation({
    mutationFn: (q: Parameters<typeof saveQuestion>[0]) => saveQuestion(q),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["question-banks"] });
      toast.success(editingQ ? "Question updated" : "Question created");
      setQuestionOpen(false);
      setEditingQ(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteQuestionMut = useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["question-banks"] }); toast.success("Question deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const publishMut = useMutation({
    mutationFn: ({ examId, notifyStudents, notifyParents }: { examId: string; notifyStudents: boolean; notifyParents: boolean }) =>
      publishResult(examId, { notify_students: notifyStudents, notify_parents: notifyParents }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-schedules"] });
      qc.invalidateQueries({ queryKey: ["exam-publications"] });
      toast.success("Results published"); setPublishExam(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const issueTranscriptMut = useMutation({
    mutationFn: ({ studentId, academicYear, examIds }: { studentId: string; academicYear: string; examIds: string[] }) =>
      issueTranscript(studentId, academicYear, examIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transcripts"] }); toast.success("Transcript issued"); setIssueTranscriptOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const completeExamMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExamStatus }) => updateExamStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-schedules"] }); toast.success("Status updated"); setMarkEntryExam(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Handlers ──
  const buildMarkObjects = (examId: string, maxMarks: number, entries: [string, string][]) =>
    entries.filter(([, v]) => v !== "").map(([student_id, marks_obtained]) => ({
      exam_id: examId, student_id, marks_obtained: Number(marks_obtained),
      grade: calculateGrade((Number(marks_obtained) / maxMarks) * 100),
      remarks: "", status: "pending" as const,
      entered_by: null as string | null, moderated_by: null as string | null, moderated_at: null as string | null,
    }));

  const handleNewSchedule = () => { setEditing(null); setDraft(emptySchedule()); setEditOpen(true); };
  const handleEditSchedule = (s: ExamSchedule) => { setEditing(s); setDraft({ ...s }); setEditOpen(true); };
  const handleSaveSchedule = () => {
    if (!draft.title.trim() || !draft.subject.trim() || !draft.grade) {
      toast.error("Title, subject, and cohort are required."); return;
    }
    saveScheduleMut.mutate(editing ? { ...draft, id: editing.id } : draft);
  };
  const handleOpenMarkEntry = async (s: ExamSchedule) => {
    setMarkEntryExam(s);
    const cached = marksByExam.get(s.id);
    if (cached && cached.length) {
      const vals: Record<string, string> = {};
      for (const m of cached) vals[m.student_id] = String(m.marks_obtained ?? "");
      setMarkValues(vals);
      return;
    }
    const existing = await getMarksForExam(s.id);
    const vals: Record<string, string> = {};
    for (const m of existing) vals[m.student_id] = String(m.marks_obtained ?? "");
    setMarkValues(vals);
  };
  const handleSaveMarks = () => {
    if (!markEntryExam) return;
    const marks = buildMarkObjects(markEntryExam.id, markEntryExam.max_marks, Object.entries(markValues));
    if (marks.length) saveMarksMut.mutate(marks);
  };
  const handleApproveAllMarks = async () => {
    if (!markEntryExam) return;
    const entries = Object.entries(markValues).filter(([, v]) => v !== "");
    if (entries.length === 0) { toast.error("No marks to approve."); return; }
    try {
      await saveExamMarks(buildMarkObjects(markEntryExam.id, markEntryExam.max_marks, entries));
      approveMarksMut.mutate({ examId: markEntryExam.id, studentIds: entries.map(([k]) => k) });
    } catch { toast.error("Failed to save marks before approval."); }
  };
  const handleNewQuestion = () => { setEditingQ(null); setQDraft(emptyQuestion()); setQuestionOpen(true); };
  const handleEditQuestion = (q: QuestionBank) => {
    setEditingQ(q);
    setQDraft({
      subject_id: q.subject_id, grade: q.grade, topic: q.topic,
      difficulty: q.difficulty, question_type: q.question_type,
      question_text: q.question_text, options: q.options,
      correct_answer: q.correct_answer, marks: q.marks, explanation: q.explanation,
    });
    setQuestionOpen(true);
  };
  const handleSaveQuestion = () => {
    if (!qDraft.question_text.trim() || !qDraft.subject_id || !qDraft.grade) {
      toast.error("Question text, subject, and grade are required."); return;
    }
    saveQuestionMut.mutate(editingQ ? { ...qDraft, id: editingQ.id } : qDraft);
  };

  const filteredQuestions = useMemo(() => {
    let r = questions;
    if (qSearch.trim()) {
      const q = qSearch.trim().toLowerCase();
      r = r.filter((item) => item.question_text.toLowerCase().includes(q) || item.topic.toLowerCase().includes(q));
    }
    return r;
  }, [questions, qSearch]);

  const questionTypeLabel = (qt: QuestionType) => QUESTION_TYPES.find((t) => t.value === qt)?.label ?? qt;

  const pagSchedules = usePagination({ data: filteredSchedules, pageSize: 12 });
  const pagQuestions = usePagination({ data: filteredQuestions, pageSize: 20 });
  const pagTranscripts = usePagination({ data: transcripts, pageSize: 20 });
  const availableForMarkEntry = useMemo(
    () => schedules.filter((s) => s.status !== "cancelled"),
    [schedules],
  );
  const pagAvailableMarks = usePagination({ data: availableForMarkEntry, pageSize: 12 });

  return (
    <div>
      <PageHeader
        title="Exams & Results"
        subtitle="Exam schedules · question bank · mark entry · grade calculation · results publishing · transcripts"
        icon={<FileBarChart className="h-6 w-6" />}
        actions={
          <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90" onClick={handleNewSchedule}>
            <Plus className="mr-2 h-4 w-4" /> New Exam
          </Button>
        }
      />

      {examsEnabled === false && (
        <Card className="mb-4 border-dashed border-warning/40 bg-warning/5 p-4 text-sm text-muted-foreground">
          The exams module is not installed in the connected Supabase project yet. Apply the Wave 7 exams migration to enable schedules, question banks, marks, and transcripts.
        </Card>
      )}

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          { label: "Total Exams", value: schedules.length, color: "text-primary" },
          { label: "Published", value: schedules.filter((s) => s.status === "published").length, color: "text-primary" },
          { label: "Completed", value: schedules.filter((s) => s.status === "completed").length, color: "text-success" },
          { label: "Questions Bank", value: questions.length, color: "text-accent-foreground" },
        ].map((k) => (
          <Card key={k.label} className="glass p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className={`mt-1 font-display text-3xl font-bold ${k.color}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 w-full flex-nowrap overflow-x-auto">
          <TabsTrigger value="schedules" className="text-xs sm:text-sm px-2 sm:px-3">Exam Schedules ({schedules.length})</TabsTrigger>
          <TabsTrigger value="question-bank" className="text-xs sm:text-sm px-2 sm:px-3">Question Bank ({questions.length})</TabsTrigger>
          <TabsTrigger value="mark-entry" className="text-xs sm:text-sm px-2 sm:px-3">Mark Entry</TabsTrigger>
          <TabsTrigger value="results" className="text-xs sm:text-sm px-2 sm:px-3">Results & Grades</TabsTrigger>
          <TabsTrigger value="transcripts" className="text-xs sm:text-sm px-2 sm:px-3">Transcripts ({transcripts.length})</TabsTrigger>
        </TabsList>

        {/* ══════ SCHEDULES ══════ */}
        <TabsContent value="schedules">
          <Card className="glass p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="examSearch" name="examSearch" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search exams…" className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9" />
              </div>
              <Select name="cohortFilter" value={cohortFilter} onValueChange={setCohortFilter}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All cohorts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cohorts</SelectItem>
                  {cohortOptions.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {schedules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No exams created yet. Click "New Exam" to schedule one.
              </div>
            ) : (
              <div>
                <TablePagination {...pagSchedules} />
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {pagSchedules.pageData.map((s) => {
                  const marks = marksByExam.get(s.id) ?? [];
                  const submitted = marks.length;
                  return (
                    <Card key={s.id} className="border-border/60 bg-card/60 p-4 hover-lift">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.subject} · {s.grade}-{s.section}</p>
                        </div>
                        <Badge variant="secondary" className={statusColor[s.status]}>{s.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{s.date}</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />Max {s.max_marks}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{submitted} marked</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] px-2"
                          onClick={() => handleEditSchedule(s)}><Edit3 className="h-3 w-3 mr-1" /> Edit</Button>
                        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] px-2"
                          onClick={() => { handleOpenMarkEntry(s); setTab("mark-entry"); }}>
                          <Eye className="h-3 w-3 mr-1" /> Marks
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{s.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>This also removes all marks for this exam.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteScheduleMut.mutate(s.id)} className="bg-destructive">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] px-2"
                          onClick={() => setPublishExam(s)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Publish
                        </Button>
                      </div>
                      {marks.length > 0 && <Progress value={(marks.length / Math.max(rosterSizeBySchedule.get(s.id) ?? 1, 1)) * 100} className="mt-3 h-1" />}
                    </Card>
                  );
                })}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ QUESTION BANK ══════ */}
        <TabsContent value="question-bank">
          <Card className="glass p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="qSearch" name="qSearch" value={qSearch} onChange={(e) => setQSearch(e.target.value)}
                  placeholder="Search questions…" className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9" />
              </div>
              <Select name="qSubjectFilter" value={qSubjectFilter} onValueChange={setQSubjectFilter}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All subjects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((sub) => <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select name="qDiffFilter" value={qDiffFilter} onValueChange={(v) => setQDiffFilter(v as Difficulty | "all")}>
                <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto sm:shrink-0" onClick={handleNewQuestion}>
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No questions yet. Click "Add Question" to create one.
              </div>
            ) : (
              <div>
                <TablePagination {...pagQuestions} />
                <div className="space-y-3">
                  {pagQuestions.pageData.map((q) => (
                  <Card key={q.id} className="border-border/60 bg-card/60 p-4 hover-lift">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">{questionTypeLabel(q.question_type)}</Badge>
                          <Badge variant="secondary" className={diffColor[q.difficulty]}>{q.difficulty}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {subjects.find((s) => s.id === q.subject_id)?.name ?? q.subject_id} · Grade {q.grade}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{q.question_text}</p>
                        {q.options && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(q.options).map(([key, val]) => (
                              <div key={key} className={cn(
                                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
                                key === q.correct_answer ? "border-success/40 bg-success/10 text-success" : "border-border/40",
                              )}>
                                <span className="font-semibold w-5">{key}.</span>
                                <span>{val}</span>
                                {key === q.correct_answer && <CheckCircle2 className="ml-auto h-3 w-3 text-success" />}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.topic && <p className="mt-2 text-xs text-muted-foreground">Topic: {q.topic}</p>}
                      </div>
                        <div className="flex flex-wrap gap-1 sm:justify-end">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                          onClick={() => handleEditQuestion(q)}><Edit3 className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete question?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteQuestionMut.mutate(q.id)} className="bg-destructive">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ MARK ENTRY ══════ */}
        <TabsContent value="mark-entry">
          <Card className="glass p-5">
            {!markEntryExam ? (
              <div>
                {availableForMarkEntry.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                    No exams available. Create an exam in the Schedules tab first.
                  </div>
                ) : (
                  <div>
                    <TablePagination {...pagAvailableMarks} />
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {pagAvailableMarks.pageData.map((s) => {
                        const marks = marksByExam.get(s.id) ?? [];
                        const rosterCount = rosterSizeBySchedule.get(s.id) ?? 0;
                        return (
                          <Card key={s.id} className="border-border/60 bg-card/60 p-4 cursor-pointer hover-lift"
                            onClick={() => { setMarkEntryExam(s); handleOpenMarkEntry(s); }}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{s.title}</p>
                                <p className="text-xs text-muted-foreground">{s.subject} · {s.grade}-{s.section}</p>
                              </div>
                              <Badge variant="secondary" className={statusColor[s.status]}>{s.status}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{s.date}</span>
                              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />Max {s.max_marks}</span>
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{marks.length}/{rosterCount} marked</span>
                            </div>
                            {marks.length > 0 && <Progress value={(marks.length / Math.max(rosterCount, 1)) * 100} className="h-1" />}
                          </Card>
                        );
                      })}
                      </div>
                    </div>
                )}
                </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{markEntryExam.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {markEntryExam.subject} · {markEntryExam.grade}-{markEntryExam.section} ·
                      Max: {markEntryExam.max_marks} · Pass: {markEntryExam.pass_marks}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button variant="outline" className="rounded-lg h-7 text-[10px] px-2" onClick={() => setMarkEntryExam(null)}>
                      <X className="mr-1 h-3 w-3" /> Close
                    </Button>
                    <Button variant="outline" className="rounded-lg h-7 text-[10px] px-2" onClick={handleApproveAllMarks}>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Approve All
                    </Button>
                    <Button className="rounded-lg bg-gradient-primary shadow-glow h-7 text-[10px] px-2" onClick={handleSaveMarks}>
                      <Save className="mr-1 h-3 w-3" /> Save Marks
                    </Button>
                  </div>
                </div>

                {roster.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                    No students found for {markEntryExam.grade}-{markEntryExam.section}.
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const allMarks = marksByExam.get(markEntryExam.id) ?? [];
                      const approved = allMarks.filter((m) => m.status === "approved").length;
                      const pending = allMarks.filter((m) => m.status === "pending").length;
                      const rejected = allMarks.filter((m) => m.status === "rejected").length;
                      const entered = allMarks.filter((m) => m.marks_obtained !== null).length;
                      return (
                        <div className="mb-3 flex flex-wrap gap-2 text-xs">
                          <span className="text-muted-foreground">{roster.length} students</span>
                          <span className="text-primary">{entered} entered</span>
                          {approved > 0 && <span className="text-success">{approved} approved</span>}
                          {pending > 0 && <span className="text-muted-foreground">{pending} pending</span>}
                          {rejected > 0 && <span className="text-destructive">{rejected} rejected</span>}
                        </div>
                      );
                    })()}
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {roster.map((student) => {
                      const mark = marksByExam.get(markEntryExam.id)?.find((m) => m.student_id === student.id);
                      const status = mark?.status ?? null;
                      return (
                      <div key={student.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">
                            {(student.first_name?.[0] ?? "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{student.display_name}</p>
                          <p className="text-xs text-muted-foreground">{student.admission_no} · Roll {student.roll_number ?? "—"}</p>
                        </div>
                        {status && (
                          <Badge variant="secondary" className={
                            status === "approved" ? "bg-success/15 text-success" :
                            status === "rejected" ? "bg-destructive/15 text-destructive" :
                            "bg-muted text-muted-foreground"
                          }>
                            {status}
                          </Badge>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Input id={"marks-" + student.id} name={"marks-" + student.id}
                            type="number" min={0} max={markEntryExam.max_marks}
                            value={markValues[student.id] ?? ""}
                            onChange={(e) => setMarkValues((v) => ({ ...v, [student.id]: e.target.value }))}
                            placeholder="Marks" className="w-20 h-9 text-center rounded-xl text-sm" />
                          {markValues[student.id] && markValues[student.id] !== "" && (
                            <Badge variant="secondary" className={
                              Number(markValues[student.id]) >= markEntryExam.pass_marks
                                ? "bg-success/15 text-success"
                                : "bg-destructive/15 text-destructive"
                            }>
                              {calculateGrade((Number(markValues[student.id]) / markEntryExam.max_marks) * 100)}
                            </Badge>
                          )}
                          {status === "pending" && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success"
                                title="Approve"
                                onClick={async () => {
                                  if (!markEntryExam) return;
                                  const val = markValues[student.id];
                                  if (val && val !== "") {
                                    try {
                                      await saveExamMarks(
                                        buildMarkObjects(markEntryExam.id, markEntryExam.max_marks, [[student.id, val]])
                                      );
                                    } catch { toast.error("Failed to save marks."); }
                                  }
                                  approveMarksMut.mutate({ examId: markEntryExam.id, studentIds: [student.id] });
                                }}>
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"
                                title="Reject"
                                onClick={() => rejectMarksMut.mutate({ examId: markEntryExam.id, studentIds: [student.id] })}>
                                <ShieldX className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                  </div>
                )}
                {roster.length > 0 && (
                  <StickyActionBar className="justify-end">
                    <Button variant="outline" className="rounded-lg h-7 text-[10px] px-2" onClick={handleApproveAllMarks}>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Approve All Marks
                    </Button>
                    <Button className="rounded-lg bg-gradient-primary shadow-glow h-7 text-[10px] px-2" onClick={handleSaveMarks}>
                      <Save className="mr-1 h-3 w-3" /> Save All Marks
                    </Button>
                    {markEntryExam && markEntryExam.status !== "completed" && (
                      <Button variant="outline" className="rounded-lg h-7 text-[10px] px-2"
                        onClick={() => completeExamMut.mutate({ id: markEntryExam.id, status: "completed" })}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Completed
                      </Button>
                    )}
                  </StickyActionBar>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ RESULTS ══════ */}
        <TabsContent value="results">
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {completedSchedules.length === 0 ? (
                <Card className="glass p-6 lg:col-span-2 text-center">
                  <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No published or completed exams yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Schedule, mark, and publish exams to see results.</p>
                </Card>
              ) : (
                completedSchedules.map((exam) => {
                  const marks = marksByExam.get(exam.id) ?? [];
                  const stats = getPassFailStats(marks, exam.pass_marks);
                  const dist = getGradeDistribution(marks, exam.max_marks);
                  const pub = publicationsMap?.get(exam.id);
                  const sorted = [...marks].sort((a, b) => (b.marks_obtained ?? 0) - (a.marks_obtained ?? 0));
                  return (
                  <Card key={exam.id} className="glass p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                      <div>
                        <h3 className="font-display text-base font-semibold">{exam.title}</h3>
                        <p className="text-xs text-muted-foreground">{exam.subject} · {exam.grade}-{exam.section}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {pub && (
                          <Badge variant="secondary" className="bg-primary/15 text-primary text-[10px]">
                            Published {new Date(pub.published_at).toLocaleDateString()}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-success/15 text-success">{stats.passRate}% pass</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-3">
                      <Card className="bg-card/60 p-2 text-center"><p className="text-lg font-bold text-primary">{stats.total}</p><p className="text-[10px] text-muted-foreground">Students</p></Card>
                      <Card className="bg-card/60 p-2 text-center"><p className="text-lg font-bold text-success">{stats.passed}</p><p className="text-[10px] text-muted-foreground">Passed</p></Card>
                      <Card className="bg-card/60 p-2 text-center"><p className="text-lg font-bold text-destructive">{stats.failed}</p><p className="text-[10px] text-muted-foreground">Failed</p></Card>
                    </div>
                    {dist.length > 0 && (
                      <div className="space-y-1.5">
                        {dist.map((d) => (
                          <div key={d.grade} className="flex items-center gap-2">
                            <span className="w-8 text-xs font-medium">{d.grade}</span>
                            <Progress value={stats.total ? (d.count / stats.total) * 100 : 0} className="h-2 flex-1" />
                            <span className="w-6 text-right text-xs text-muted-foreground">{d.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sorted.length > 0 && (
                      <div className="mt-3">
                        <button onClick={() => setRankOpen((r) => ({ ...r, [exam.id]: !r[exam.id] }))}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <BarChart3 className="h-3 w-3" /> Ranked List ({sorted.length})
                        </button>
                        {rankOpen[exam.id] && (
                          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto rounded-xl border border-border/60 p-2">
                            {sorted.slice(0, 50).map((m, i) => {
                              const student = students.find((s) => s.id === m.student_id);
                              return (
                                <div key={m.id} className="flex items-center justify-between text-xs py-1">
                                  <span className="text-muted-foreground w-6">#{i + 1}</span>
                                  <span className="flex-1 truncate">{student?.display_name ?? "Unknown"}</span>
                                  <span className="font-medium">{m.marks_obtained ?? "—"}</span>
                                  <Badge variant="secondary" className="ml-2 text-[10px]">{m.grade ?? "—"}</Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
                })
              )}
            </div>

            {/* Report Card: per-student GPA across all exams */}
            {completedSchedules.length > 0 && (
              <Card className="glass p-5">
                <button onClick={() => setGpExpanded(!gpExpanded)}
                  className="flex items-center gap-2 w-full text-left">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="font-display text-lg font-semibold">Student Report Card</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{gpExpanded ? "Hide" : "Show"}</Badge>
                </button>
                {gpExpanded && (
                  <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {(() => {
                      const studentGpas = students.map((student) => {
                        let totalMarks = 0;
                        let obtainedMarks = 0;
                        let examCount = 0;
                        const grades: string[] = [];
                        for (const exam of completedSchedules) {
                          const mark = marksByExam.get(exam.id)?.find((m) => m.student_id === student.id);
                          if (mark && mark.marks_obtained !== null && mark.status === "approved") {
                            totalMarks += exam.max_marks;
                            obtainedMarks += mark.marks_obtained;
                            examCount++;
                            grades.push(calculateGrade((mark.marks_obtained / exam.max_marks) * 100));
                          }
                        }
                        if (examCount === 0) return null;
                        const pct = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : null;
                        const gpa = grades.length ? Math.round(calculateGPA(grades) * 100) / 100 : null;
                        return { student, examCount, totalMarks, obtainedMarks, pct, gpa };
                      }).filter((r): r is NonNullable<typeof r> => r !== null)
                       .sort((a, b) => (b.gpa ?? 0) - (a.gpa ?? 0));

                      return studentGpas.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No approved marks found.</p>
                      ) : studentGpas.map((r) => (
                        <div key={r.student.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-center">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">
                              {(r.student.first_name?.[0] ?? "?").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{r.student.display_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {r.examCount} exam{r.examCount !== 1 ? "s" : ""} · {r.obtainedMarks}/{r.totalMarks} ({r.pct !== null ? r.pct + "%" : "—"})
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{r.gpa !== null ? r.gpa.toFixed(2) : "—"}</p>
                            <p className="text-[10px] text-muted-foreground">GPA</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className={r.pct !== null && r.pct >= 40 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}>
                              {r.pct !== null ? calculateGrade(r.pct) : "—"}
                            </Badge>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ══════ TRANSCRIPTS ══════ */}
        <TabsContent value="transcripts">
          <Card className="glass p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select name="transcriptStudentFilter" value={transcriptStudentFilter} onValueChange={setTranscriptStudentFilter}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All students" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {students.slice(0, 50).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.display_name} ({s.admission_no})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select name="transcriptYearFilter" value={transcriptYearFilter} onValueChange={setTranscriptYearFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Academic year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                  <SelectItem value="2026-27">2026-27</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full rounded-xl bg-gradient-primary shadow-glow sm:ml-auto sm:w-auto sm:shrink-0"
                onClick={() => {
                  const completed = schedules.filter((s) => s.status === "completed");
                  if (completed.length === 0) {
                    toast.error("No completed exams. Mark and complete exams first.");
                    return;
                  }
                  setIssueStudentId("");
                  setIssueYear("2025-26");
                  setIssueExamIds([]);
                  setIssueTranscriptOpen(true);
                }}>
                <Plus className="mr-2 h-4 w-4" /> Issue Transcript
              </Button>
            </div>

            {transcripts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                No transcripts issued yet. Publish results and issue transcripts here.
              </div>
            ) : (
              <div>
                <TablePagination {...pagTranscripts} />
                <div className="space-y-3">
                  {pagTranscripts.pageData.map((t) => {
                  const student = students.find((s) => s.id === t.student_id);
                  return (
                    <Card key={t.id} className="border-border/60 bg-card/60 p-4 hover-lift">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{student?.display_name ?? "Unknown"}</span>
                            <Badge variant="secondary" className={t.status === "issued" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
                              {t.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Year: {t.academic_year} · {t.exam_ids.length} exams ·
                            Marks: {t.obtained_marks ?? "—"}/{t.total_marks ?? "—"}
                            {t.percentage !== null ? ` · ${t.percentage}%` : ""}
                            {t.gpa !== null ? ` · GPA: ${t.gpa}` : ""}
                          </p>
                          {t.issued_at && <p className="text-xs text-muted-foreground mt-1">Issued: {new Date(t.issued_at).toLocaleDateString()}</p>}
                        </div>
                        <div className="flex flex-wrap gap-1 sm:justify-end">
                          <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs"
                            onClick={() => generateTranscriptPDF(t)}
                            disabled={pdfLoading === t.id}>
                            {pdfLoading === t.id
                              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              : <Download className="h-3 w-3 mr-1" />}
                            PDF
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs"
                            onClick={() => {
                              const student = students.find((s) => s.id === t.student_id);
                              if (student) {
                                const subject = encodeURIComponent(`Transcript - ${student.display_name}`);
                                const body = encodeURIComponent(
                                  `Academic Transcript for ${student.display_name} (${t.academic_year})\n\n` +
                                  `Percentage: ${t.percentage ?? "—"}%\nGPA: ${t.gpa ?? "—"}\n\nIssued: ${t.issued_at ? new Date(t.issued_at).toLocaleDateString() : "—"}`
                                );
                                window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
                              }
                            }}>
                            <Mail className="h-3 w-3 mr-1" /> Email
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════ SCHEDULE DIALOG ══════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm p-4">
          <DialogHeader className="mb-0"><DialogTitle className="text-base">{editing ? "Edit Exam" : "New Exam"}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <div className="grid gap-1.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-[10px]" htmlFor="examTitle">Title</Label>
                <Input id="examTitle" name="examTitle" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Midterm Exam 2025-26" className="h-8 text-sm" />
              </div>
              <div><Label className="text-[10px]" htmlFor="examType">Type</Label>
                <Select name="examType" value={draft.exam_type} onValueChange={(v: string) => setDraft({ ...draft, exam_type: v as ExamType })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{EXAM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[10px]" htmlFor="examSubject">Subject</Label>
                <Input id="examSubject" name="examSubject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Mathematics" className="h-8 text-sm" />
              </div>
              <div><Label className="text-[10px]" htmlFor="examGrade">Grade</Label>
                <Select name="examGrade" value={draft.grade} onValueChange={(v: string) => setDraft({ ...draft, grade: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{cohortOptions.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[10px]" htmlFor="examSection">Section</Label>
                <Select name="examSection" value={draft.section} onValueChange={(v: string) => setDraft({ ...draft, section: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{["A", "B", "C", "D"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[10px]" htmlFor="examDate">Date</Label>
                <Input id="examDate" name="examDate" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="h-8 text-sm" />
              </div>
              <div><Label className="text-[10px]" htmlFor="examStart">Start</Label>
                <Input id="examStart" name="examStart" type="time" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} className="h-8 text-sm" />
              </div>
              <div><Label className="text-[10px]" htmlFor="examEnd">End</Label>
                <Input id="examEnd" name="examEnd" type="time" value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} className="h-8 text-sm" />
              </div>
              <div><Label className="text-[10px]" htmlFor="examMaxMarks">Max</Label>
                <Input id="examMaxMarks" name="examMaxMarks" type="number" value={draft.max_marks} onChange={(e) => setDraft({ ...draft, max_marks: Number(e.target.value) })} className="h-8 text-sm" />
              </div>
              <div><Label className="text-[10px]" htmlFor="examPassMarks">Pass</Label>
                <Input id="examPassMarks" name="examPassMarks" type="number" value={draft.pass_marks} onChange={(e) => setDraft({ ...draft, pass_marks: Number(e.target.value) })} className="h-8 text-sm" />
              </div>
              <div><Label className="text-[10px]" htmlFor="examStatus">Status</Label>
                <Select name="examStatus" value={draft.status} onValueChange={(v: string) => setDraft({ ...draft, status: v as ExamStatus })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-[10px]" htmlFor="examDescription">Description</Label>
              <Textarea id="examDescription" name="examDescription" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={1} className="min-h-[36px] text-sm" />
            </div>
            <Button className="w-full rounded-xl bg-gradient-primary shadow-glow h-8 text-xs" onClick={handleSaveSchedule} disabled={saveScheduleMut.isPending}>
              {saveScheduleMut.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ QUESTION DIALOG ══════ */}
      <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
        <DialogContent className="p-4">
          <DialogHeader className="mb-0"><DialogTitle className="text-base">{editingQ ? "Edit Question" : "New Question"}</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <div className="grid gap-1 sm:grid-cols-2">
              <div><Label className="text-[10px]" htmlFor="qSubject">Subject</Label>
                <Select name="qSubject" value={qDraft.subject_id} onValueChange={(v: string) => setQDraft({ ...qDraft, subject_id: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{subjects.map((sub) => <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[10px]" htmlFor="qGrade">Grade</Label>
                <Select name="qGrade" value={qDraft.grade} onValueChange={(v: string) => setQDraft({ ...qDraft, grade: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{cohortOptions.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[10px]" htmlFor="qType">Type</Label>
                <Select name="qType" value={qDraft.question_type} onValueChange={(v: string) => {
                  const qt = v as QuestionType;
                  setQDraft({ ...qDraft, question_type: qt, options: qt === "mcq" ? { A: "", B: "", C: "", D: "" } : null });
                }}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{QUESTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[10px]" htmlFor="qDifficulty">Difficulty</Label>
                <Select name="qDifficulty" value={qDraft.difficulty} onValueChange={(v: string) => setQDraft({ ...qDraft, difficulty: v as Difficulty })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[10px]" htmlFor="qMarks">Marks</Label>
                <Input id="qMarks" name="qMarks" type="number" min={0.5} step={0.5} value={qDraft.marks}
                  onChange={(e) => setQDraft({ ...qDraft, marks: Number(e.target.value) })} className="h-7 text-xs" />
              </div>
              <div><Label className="text-[10px]" htmlFor="qTopic">Topic</Label>
                <Input id="qTopic" name="qTopic" value={qDraft.topic} onChange={(e) => setQDraft({ ...qDraft, topic: e.target.value })} placeholder="e.g. Algebra" className="h-7 text-xs" />
              </div>
            </div>
            <div><Label className="text-[10px]" htmlFor="qText">Question</Label>
              <Textarea id="qText" name="qText" value={qDraft.question_text} onChange={(e) => setQDraft({ ...qDraft, question_text: e.target.value })} rows={2} className="min-h-[32px] text-xs" />
            </div>
            {qDraft.question_type === "mcq" && (
              <div className="space-y-1">
                <Label className="text-[10px]" htmlFor="option-A">Options</Label>
                {["A", "B", "C", "D"].map((key) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className="w-4 text-[10px] font-semibold text-muted-foreground">{key}.</span>
                    <Input id={"option-" + key} name={"option-" + key} value={(qDraft.options as Record<string, string>)?.[key] ?? ""}
                      onChange={(e) => setQDraft({
                        ...qDraft,
                        options: { ...(qDraft.options as Record<string, string> ?? {}), [key]: e.target.value },
                      })}
                      placeholder={`Option ${key}`} className="flex-1 rounded-lg text-xs h-7" />
                    <button type="button"
                      className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        qDraft.correct_answer === key ? "border-success bg-success text-white" : "border-border hover:border-success/50",
                      )}
                      onClick={() => setQDraft({ ...qDraft, correct_answer: key })}
                      title="Mark as correct">
                      {qDraft.correct_answer === key && <CheckCircle2 className="h-2 w-2" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {qDraft.question_type !== "mcq" && (
              <div><Label className="text-[10px]" htmlFor="qCorrectAnswer">Correct Answer</Label>
                <Textarea id="qCorrectAnswer" name="qCorrectAnswer" value={qDraft.correct_answer} onChange={(e) => setQDraft({ ...qDraft, correct_answer: e.target.value })} rows={1} className="min-h-[28px] text-xs" />
              </div>
            )}
            <div><Label className="text-[10px]" htmlFor="qExplanation">Explanation</Label>
              <Textarea id="qExplanation" name="qExplanation" value={qDraft.explanation ?? ""} onChange={(e) => setQDraft({ ...qDraft, explanation: e.target.value })} rows={1} className="min-h-[28px] text-xs" />
            </div>
            <Button className="w-full rounded-xl bg-gradient-primary shadow-glow h-7 text-xs" onClick={handleSaveQuestion} disabled={saveQuestionMut.isPending}>
              {saveQuestionMut.isPending ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
              {editingQ ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ PUBLISH DIALOG ══════ */}
      <Dialog open={publishExam !== null} onOpenChange={(o) => !o && setPublishExam(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Publish Results</DialogTitle></DialogHeader>
          {publishExam && (
            <div className="space-y-4">
              <p className="text-sm">Publish results for <strong>{publishExam.title}</strong>?</p>
              <p className="text-xs text-muted-foreground">{publishExam.subject} · {publishExam.grade}-{publishExam.section}</p>
              <div className="flex items-center gap-2">
                <Checkbox id="notify-students" checked={publishNotifyStudents}
                  onCheckedChange={(v) => setPublishNotifyStudents(v === true)} />
                <Label htmlFor="notify-students" className="text-sm">Notify students</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="notify-parents" checked={publishNotifyParents}
                  onCheckedChange={(v) => setPublishNotifyParents(v === true)} />
                <Label htmlFor="notify-parents" className="text-sm">Notify parents</Label>
              </div>
              <Button className="w-full rounded-xl bg-gradient-primary shadow-glow"
                onClick={() => publishMut.mutate({
                  examId: publishExam.id, notifyStudents: publishNotifyStudents, notifyParents: publishNotifyParents,
                })}
                disabled={publishMut.isPending}>
                {publishMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Publish Results
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════ ISSUE TRANSCRIPT DIALOG ══════ */}
      <Dialog open={issueTranscriptOpen} onOpenChange={setIssueTranscriptOpen}>
        <DialogContent className="sm:max-w-sm p-4">
          <DialogHeader><DialogTitle>Issue Transcript</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs" htmlFor="issueStudentId">Student</Label>
              <Select name="issueStudentId" value={issueStudentId} onValueChange={setIssueStudentId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.display_name} ({s.admission_no})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs" htmlFor="issueYear">Academic Year</Label>
              <Select name="issueYear" value={issueYear} onValueChange={setIssueYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                  <SelectItem value="2026-27">2026-27</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Include Exams ({schedules.filter((s) => s.status === "completed").length} completed)</Label>
              <div className="mt-1 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2">
                {schedules.filter((s) => s.status === "completed").length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">No completed exams yet.</p>
                ) : (
                  schedules.filter((s) => s.status === "completed").map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Checkbox id={`exam-${s.id}`} checked={issueExamIds.includes(s.id)}
                        onCheckedChange={(v) => {
                          if (v) setIssueExamIds((prev) => [...prev, s.id]);
                          else setIssueExamIds((prev) => prev.filter((id) => id !== s.id));
                        }} />
                      <Label htmlFor={`exam-${s.id}`} className="text-xs flex-1 cursor-pointer">
                        {s.title} — {s.subject} ({s.grade}-{s.section})
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
            <Button className="w-full rounded-xl bg-gradient-primary shadow-glow"
              disabled={!issueStudentId || issueExamIds.length === 0 || issueTranscriptMut.isPending}
              onClick={() => {
                issueTranscriptMut.mutate({
                  studentId: issueStudentId,
                  academicYear: issueYear,
                  examIds: issueExamIds,
                });
              }}>
              {issueTranscriptMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
              Issue Transcript
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
