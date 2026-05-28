import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, ChevronDown, Mail, Phone, IdCard, Save, SkipForward,
  Eye, Search, X, ArrowLeft, User, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchStudentRegister } from "@/lib/student-records";
import { resolveMissingFieldsFeedbackLoop } from "@/lib/student-workspace-messaging";
import { loadImportBatchHistory } from "@/lib/student-import";
import type { StudentRegisterRow } from "@/lib/student-records";

const NOT_AVAILABLE_KEY = "sms.field-not-available.v1";
const LAST_FILTER_KEY = "sms.missing-fields-last-filter.v1";

type FocusMode = "contact" | "emis" | "bank";
type ScopeMode = "all" | "batch";

interface LastFilter {
  focus: FocusMode;
  scope: ScopeMode;
  scopeBatchId?: string;
}

const FOCUS_OPTIONS: { value: FocusMode; label: string; fields: string[] }[] = [
  { value: "contact", label: "Mobile, Email", fields: ["phone", "email", "alternatePhone"] },
  { value: "emis", label: "EMIS", fields: ["emisId", "umisId"] },
  { value: "bank", label: "Bank", fields: [] },
];

type FieldKey = "phone" | "email" | "alternatePhone" | "emisId" | "umisId";

interface FieldDef {
  key: FieldKey;
  label: string;
  icon: typeof Phone | typeof Mail | typeof IdCard;
  section: "contact" | "identifiers" | "bank";
  required: boolean;
  placeholder: string;
  helper: string;
}

const ALL_FIELDS: FieldDef[] = [
  { key: "phone", label: "Mobile number", icon: Phone, section: "contact", required: true, placeholder: "+91 98765 43210", helper: "Preferred WhatsApp or SMS contact for guardians" },
  { key: "alternatePhone", label: "Alternate mobile", icon: Phone, section: "contact", required: false, placeholder: "+91 98765 43210", helper: "Secondary contact number" },
  { key: "email", label: "Email address", icon: Mail, section: "contact", required: false, placeholder: "student@gct.ac.in", helper: "Used for alerts and notifications" },
  { key: "emisId", label: "EMIS ID", icon: IdCard, section: "identifiers", required: true, placeholder: "EMIS-XXXXXXXX", helper: "Required for state reporting" },
  { key: "umisId", label: "UMIS ID", icon: IdCard, section: "identifiers", required: false, placeholder: "UMIS-XXXXXXXX", helper: "University MIS identifier" },
];

const RECORD_FIELD_MAP: Record<string, string> = {
  phone: "phone",
  email: "email",
  alternatePhone: "alternate_phone",
  emisId: "emis_id",
  umisId: "umis_id",
};

function sv(student: StudentRegisterRow, key: string): string {
  const k = RECORD_FIELD_MAP[key] || key;
  return (student as Record<string, any>)[k] ?? "";
}

function isMissing(student: StudentRegisterRow, key: string): boolean {
  const v = sv(student, key);
  return !v || !v.trim() || v === "NOT_AVAILABLE";
}

function missingFieldsFor(student: StudentRegisterRow, focus: FocusMode): FieldDef[] {
  const fieldKeys = FOCUS_OPTIONS.find((f) => f.value === focus)?.fields ?? [];
  const fieldDefs = fieldKeys.map((k) => ALL_FIELDS.find((f) => f.key === k)).filter(Boolean) as FieldDef[];
  return fieldDefs.filter((f) => isMissing(student, f.key));
}

function studentInitials(student: StudentRegisterRow): string {
  const words = [student.first_name, student.last_name].filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "ST";
}

function loadNA(): Record<string, Record<string, string>> {
  try { return JSON.parse(localStorage.getItem(NOT_AVAILABLE_KEY) || "{}"); } catch { return {}; }
}

function saveNA(studentId: string, fieldKey: string, reason: string): void {
  const map = loadNA();
  if (!map[studentId]) map[studentId] = {};
  map[studentId][fieldKey] = reason;
  localStorage.setItem(NOT_AVAILABLE_KEY, JSON.stringify(map));
}

function removeNA(studentId: string, fieldKey: string): void {
  const map = loadNA();
  if (map[studentId]) {
    delete map[studentId][fieldKey];
    if (!Object.keys(map[studentId]).length) delete map[studentId];
    localStorage.setItem(NOT_AVAILABLE_KEY, JSON.stringify(map));
  }
}

function isNA(studentId: string, fieldKey: string): boolean {
  return !!loadNA()[studentId]?.[fieldKey];
}

function loadLastFilter(): LastFilter {
  try {
    const raw = localStorage.getItem(LAST_FILTER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { focus: "contact", scope: "all" };
}

function saveLastFilter(filter: LastFilter): void {
  try { localStorage.setItem(LAST_FILTER_KEY, JSON.stringify(filter)); } catch {}
}

const NA_REASONS = [
  "Guardian unreachable",
  "Student to submit later",
  "Information not provided",
  "Other (specify)",
];

type ScopedBatch = { name: string; id: string };

export default function MissingCriticalFields() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState<StudentRegisterRow[]>([]);
  const [batches, setBatches] = useState<ScopedBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [focus, setFocus] = useState<FocusMode>(loadLastFilter().focus);
  const [scopeMode, setScopeMode] = useState<ScopeMode>(loadLastFilter().scope);
  const [scopeBatchId, setScopeBatchId] = useState<string | undefined>(loadLastFilter().scopeBatchId);
  const [searchQuery, setSearchQuery] = useState("");
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ saved: 0, skipped: 0 });
  const [naDialog, setNaDialog] = useState<{ open: boolean; fieldKey?: FieldKey }>({ open: false });
  const [naReason, setNaReason] = useState(NA_REASONS[0]);
  const [naNotes, setNaNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fromContext = searchParams.get("from");
  const contextLabel = searchParams.get("label");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [studentData, batchData] = await Promise.all([
          fetchStudentRegister(),
          loadImportBatchHistory(10).then((batches) =>
            batches.map((b) => ({ name: b.batchName || `Batch ${b.id.slice(0, 8)}`, id: b.id }))
          ),
        ]);
        if (!cancelled) {
          setStudents(studentData);
          setBatches(batchData);
        }
      } catch {
        if (!cancelled) setStudents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const scopedStudents = useMemo(() => {
    if (scopeMode === "all") return students;
    return students;
  }, [students, scopeMode]);

  const queue = useMemo(() => {
    let q = scopedStudents.filter((s) => !processedIds.has(s.id) && missingFieldsFor(s, focus).length > 0);
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      q = q.filter(
        (s) =>
          s.display_name.toLowerCase().includes(qLower) ||
          s.admission_no.toLowerCase().includes(qLower),
      );
    }
    return q.sort((a, b) => missingFieldsFor(b, focus).length - missingFieldsFor(a, focus).length);
  }, [scopedStudents, processedIds, focus, searchQuery]);

  useEffect(() => {
    if (currentIdx >= queue.length) setCurrentIdx(Math.max(0, queue.length - 1));
  }, [queue.length, currentIdx]);

  const current = queue[currentIdx] ?? null;

  const focusFields = useMemo(() => current ? missingFieldsFor(current, focus) : [], [current, focus]);

  const pendingFilter = useMemo(() => {
    const filter: LastFilter = { focus, scope: scopeMode, scopeBatchId };
    saveLastFilter(filter);
  }, [focus, scopeMode, scopeBatchId]);

  useEffect(() => {
    if (!current) return;
    const init: Record<string, string> = {};
    for (const f of focusFields) {
      const val = sv(current, f.key);
      init[f.key] = isNA(current.id, f.key) ? "" : (val !== "NOT_AVAILABLE" ? val : "");
    }
    setFormValues(init);
    setFieldErrors({});
  }, [current?.id, focus]);

  const validate = useCallback((key: string, value: string): string | null => {
    if (!value.trim()) return null;
    if (key === "phone" || key === "alternatePhone") {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) return "Mobile should be 10 digits";
    }
    if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
    if ((key === "emisId" || key === "umisId") && value.trim().length < 4) return "ID must be at least 4 characters";
    return null;
  }, []);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    const err = validate(key, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[key] = err;
      else delete next[key];
      return next;
    });
  }, [validate]);

  const doSave = useCallback(async () => {
    if (!current || saving) return;
    const errors: Record<string, string> = {};
    for (const f of focusFields) {
      const val = formValues[f.key]?.trim();
      if (!val && !isNA(current.id, f.key) && f.required) errors[f.key] = `${f.label} is required`;
      else if (val) {
        const err = validate(f.key, val);
        if (err) errors[f.key] = err;
      }
    }
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setSaving(true);
    try {
      const raw = localStorage.getItem("sms.student-register.v1");
      if (raw) {
        const stored: StudentRegisterRow[] = JSON.parse(raw);
        const idx = stored.findIndex((s) => s.id === current.id);
        if (idx !== -1) {
          const updated = { ...stored[idx] } as Record<string, any>;
          for (const f of focusFields) {
            const val = formValues[f.key]?.trim();
            const recKey = RECORD_FIELD_MAP[f.key];
            if (recKey) updated[recKey] = val || (isNA(current.id, f.key) ? "NOT_AVAILABLE" : updated[recKey]);
          }
          stored[idx] = updated as StudentRegisterRow;
          localStorage.setItem("sms.student-register.v1", JSON.stringify(stored));
        }
      }
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== current.id) return s;
          const updated = { ...s } as Record<string, any>;
          for (const f of focusFields) {
            const val = formValues[f.key]?.trim();
            const recKey = RECORD_FIELD_MAP[f.key];
            if (recKey) updated[recKey] = val || (isNA(current.id, f.key) ? "NOT_AVAILABLE" : updated[recKey]);
          }
          return updated as StudentRegisterRow;
        }),
      );
      setStats((prev) => ({ ...prev, saved: prev.saved + 1 }));
      setProcessedIds((prev) => new Set(prev).add(current.id));
    } catch {
      toast.error("Could not save changes. Try again.");
    } finally {
      setSaving(false);
    }
  }, [current, focusFields, formValues, validate, saving]);

  const handleSkip = useCallback(() => {
    if (!current) return;
    setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
    setProcessedIds((prev) => new Set(prev).add(current.id));
  }, [current]);

  const openNaDialog = useCallback((fieldKey?: FieldKey) => {
    setNaReason(NA_REASONS[0]);
    setNaNotes("");
    setNaDialog({ open: true, fieldKey });
  }, []);

  const confirmNa = useCallback(() => {
    if (!current) return;
    const target = focusFields.filter((f) => !naDialog.fieldKey || f.key === naDialog.fieldKey);
    const reason = naReason === "Other (specify)" && naNotes.trim() ? naNotes.trim() : naReason;
    for (const f of target) saveNA(current.id, f.key, reason);
    if (naDialog.fieldKey) {
      setFormValues((prev) => ({ ...prev, [naDialog.fieldKey]: "" }));
    } else {
      const next = { ...formValues };
      for (const f of target) next[f.key] = "";
      setFormValues(next);
    }
    setStats((prev) => ({ ...prev, notAvailable: (prev as any).notAvailable ?? 0 + 1 }));
    setNaDialog({ open: false });
    toast.success("Marked as not available");
  }, [current, focusFields, naDialog, naReason, naNotes, formValues]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !naDialog.open) { e.preventDefault(); doSave(); }
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); doSave(); }
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); handleSkip(); }
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === "n") { e.preventDefault(); openNaDialog(); }
    },
    [doSave, handleSkip, openNaDialog, naDialog.open],
  );

  useEffect(() => {
    if (queue.length === 0 && processedIds.size > 0 && students.length > 0) {
      const total = students.filter((s) => missingFieldsFor(s, focus).length > 0).length;
      resolveMissingFieldsFeedbackLoop(0, total);
    }
  }, [queue.length, processedIds.size, students.length, focus]);

  const handleFocusChange = useCallback((value: string) => {
    setFocus(value as FocusMode);
    setCurrentIdx(0);
  }, []);

  const handleScopeChange = useCallback((value: string) => {
    if (value === "all") { setScopeMode("all"); setScopeBatchId(undefined); }
    else { setScopeMode("batch"); setScopeBatchId(value); }
    setCurrentIdx(0);
  }, []);

  const clearContext = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const resetSession = useCallback(() => {
    setProcessedIds(new Set());
    setCurrentIdx(0);
    setStats({ saved: 0, skipped: 0 });
  }, []);

  const allDone = queue.length === 0 && students.length > 0 && processedIds.size > 0;
  const noStudentsEver = students.length === 0 && !loading;

  const scopeTotal = useMemo(
    () => students.filter((s) => missingFieldsFor(s, focus).length > 0).length,
    [students, focus],
  );

  const sectionedFields = useMemo(() => {
    const sections: { title: string; fields: FieldDef[] }[] = [];
    const contact = focusFields.filter((f) => f.section === "contact");
    const identifiers = focusFields.filter((f) => f.section === "identifiers");
    const bank = focusFields.filter((f) => f.section === "bank");
    if (contact.length) sections.push({ title: "Contact details", fields: contact });
    if (identifiers.length) sections.push({ title: "Identifiers", fields: identifiers });
    if (bank.length) sections.push({ title: "Bank details", fields: bank });
    return sections;
  }, [focusFields]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading student records...</p>
        </div>
      </div>
    );
  }

  const scopeOptions = [
    { value: "all", label: "All Students" },
    ...batches.map((b) => ({ value: b.id, label: `Batch ${b.name}` })),
  ];

  const focusLabel = FOCUS_OPTIONS.find((f) => f.value === focus)?.label ?? "Mobile, Email";

  return (
    <div className="flex flex-col gap-4 p-6" onKeyDown={handleKeyDown}>
      {/* ── State D: Context banner ── */}
      {fromContext && (
        <Card className={cn("p-3 border", allDone ? "border-green-200 bg-green-50/50" : "border-sky-200 bg-sky-50/50")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              {allDone ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-sky-600" />
              )}
              <span>
                {allDone
                  ? `You have updated all missing critical fields for '${contextLabel ?? fromContext}'.`
                  : `From ${fromContext === "todo" ? "To-Do" : "Alert"}: ${contextLabel ?? fromContext}`}
              </span>
              {!allDone && contextLabel && (
                <span className="text-xs text-muted-foreground">
                  You are fixing mobiles for {contextLabel.toLowerCase()}.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs" onClick={clearContext}>
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
              {allDone && (
                <Button variant="outline" size="sm" className="h-7 rounded-lg text-xs" onClick={() => navigate("/")}>
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back to Dashboard
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Header bar ── */}
      <PageHeader
        title="Missing Critical Fields"
        subtitle={`${focusLabel} gaps in ${scopeMode === "all" ? "all students" : `batch ${batches.find((b) => b.id === scopeBatchId)?.name ?? scopeBatchId}`}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
              <User className="h-3 w-3" />
              Students: {scopeTotal}
            </div>
            <Badge variant="outline" className="border-sky-200 text-sky-700 text-[10px]">
              Completed: {stats.saved}
            </Badge>
            <Badge variant="outline" className="border-amber-200 text-amber-700 text-[10px]">
              Fields: {focusLabel}
            </Badge>
          </div>
        }
      />

      {/* ── Filters row: Focus dropdown + Scope dropdown ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Focus:</span>
          <Select value={focus} onValueChange={handleFocusChange}>
            <SelectTrigger className="h-8 w-[150px] text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOCUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Scope:</span>
          <Select value={scopeMode === "all" ? "all" : (scopeBatchId ?? "all")} onValueChange={handleScopeChange}>
            <SelectTrigger className="h-8 w-[180px] text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── State A: Empty / All good ── */}
      {noStudentsEver ? (
        <div className="flex flex-col items-center justify-center py-24">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-lg font-semibold">No Students Found</h2>
          <p className="text-sm text-muted-foreground mt-2">No student records are available in the register.</p>
        </div>
      ) : allDone && queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">All critical fields are complete for this scope</h2>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-lg">
            There are no students with missing {focusLabel} details in the current filter.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Button className="rounded-lg" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-lg">
                  Change filters
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {FOCUS_OPTIONS.filter((f) => f.value !== focus).map((opt) => (
                  <DropdownMenuItem key={opt.value} onClick={() => { setFocus(opt.value); setCurrentIdx(0); }}>
                    Focus: {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : current ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* ── Left: Student Queue Panel ── */}
          <Card className="border-border/60 bg-card/60 p-4 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Students needing updates ({queue.length})
              </p>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name / regno..."
                className="h-8 pl-8 text-xs rounded-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {FOCUS_OPTIONS.map((opt) => {
                const count = queue.filter((s) =>
                  opt.fields.some((k) => isMissing(s, k as FieldKey)),
                ).length;
                if (count === 0) return null;
                return (
                  <Badge
                    key={opt.value}
                    variant={focus === opt.value ? "default" : "outline"}
                    className="text-[10px] cursor-pointer"
                    onClick={() => handleFocusChange(opt.value)}
                  >
                    {opt.label.replace("Mobile, Email", "Mobile missing").replace("EMIS", "EMIS missing").replace("Bank", "Bank incomplete")} ({count})
                  </Badge>
                );
              })}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {queue.map((student, idx) => {
                const fields = missingFieldsFor(student, focus);
                return (
                  <button
                    key={student.id}
                    type="button"
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2.5 border transition-all",
                      idx === currentIdx
                        ? "border-primary/40 bg-primary/5 shadow-sm border-l-2 border-l-primary"
                        : "border-transparent hover:border-border/60 hover:bg-accent/30",
                    )}
                    onClick={() => setCurrentIdx(idx)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{student.display_name}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">({student.admission_no})</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {[student.grade, student.section].filter(Boolean).join("-") || "Unassigned"}
                          {student.community ? ` · ${student.community}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        {fields.map((f) => {
                          const Icon = f.icon;
                          return (
                            <Icon
                              key={f.key}
                              className={cn("h-3 w-3", f.required ? "text-rose-500" : "text-amber-500")}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </button>
                );
              })}
              {queue.length === 0 && searchQuery && (
                <p className="text-xs text-muted-foreground text-center py-6">No students match your search.</p>
              )}
            </div>
          </Card>

          {/* ── Right: Guided-Fill Panel ── */}
          <Card className="border-border/60 bg-card/60 p-6" tabIndex={-1}>
            {/* Student identity */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {studentInitials(current)}
                </span>
                <div>
                  <h2 className="text-xl font-semibold">{current.display_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {current.admission_no}
                    {current.grade ? ` · ${current.grade}` : ""}
                    {current.section ? `-${current.section}` : ""}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {current.fee_status === "pending" ? "New Admission" : "Existing"}
                    </Badge>
                    {current.community && (
                      <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-700">
                        Community: {current.community}
                      </Badge>
                    )}
                    {current.blood_group && (
                      <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
                        Blood: {current.blood_group}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {focusFields.length} field{focusFields.length !== 1 ? "s" : ""} missing
              </Badge>
            </div>

            {/* Critical Fields Form */}
            <div className="mt-6 space-y-6">
              {sectionedFields.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  All critical fields are complete for this student.
                </div>
              ) : (
                sectionedFields.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-semibold mb-3 capitalize">{section.title}</h3>
                    <div className="space-y-4">
                      {section.fields.map((field) => {
                        const na = isNA(current.id, field.key);
                        const error = fieldErrors[field.key];
                        const Icon = field.icon;
                        return (
                          <div key={field.key}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium flex items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                {field.label}
                                {field.required && <span className="text-rose-500">*</span>}
                              </label>
                              <div className="flex items-center gap-1">
                                {!na && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 rounded-md px-2 text-[10px] text-muted-foreground"
                                    onClick={() => openNaDialog(field.key)}
                                  >
                                    Not available
                                  </Button>
                                )}
                                {na && (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-[10px]">
                                      Not available
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 rounded-md px-1 text-[10px] text-muted-foreground"
                                      onClick={() => {
                                        removeNA(current.id, field.key);
                                        toast.success("Marking removed");
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {na ? (
                              <p className="text-xs text-muted-foreground italic">
                                Marked as not available ({loadNA()[current.id]?.[field.key]})
                              </p>
                            ) : (
                              <>
                                <p className="text-[10px] text-muted-foreground mb-1.5">{field.helper}</p>
                                <Input
                                  value={formValues[field.key] ?? ""}
                                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                  placeholder={field.placeholder}
                                  className={cn("h-9 text-sm", error ? "border-rose-300" : "")}
                                />
                              </>
                            )}
                            {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom: Actions row */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-5">
              <div className="text-xs text-muted-foreground">
                <p>Student {currentIdx + 1} of {queue.length} in current queue</p>
                {stats.saved > 0 && (
                  <p className="mt-0.5">Session progress: {stats.saved} updated, {stats.skipped} skipped</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="rounded-lg text-xs h-8" onClick={handleSkip} title="Alt+K">
                  <SkipForward className="h-3.5 w-3.5 mr-1.5" />
                  Skip for now
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg text-xs h-8" onClick={() => openNaDialog()} title="Alt+N">
                  Mark as not available
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg text-xs h-8" onClick={() => window.open(`/students/${current.id}`, "_blank")} title="View full record">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View
                </Button>
                <Button size="sm" className="rounded-lg text-xs h-8" onClick={doSave} disabled={saving} title="Alt+S or Enter">
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Save &amp; Next
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* ── State A variant: Empty scope ── */
        <div className="flex flex-col items-center justify-center py-24">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-lg font-semibold">All critical fields are complete for this scope</h2>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-lg">
            There are no students with missing {focusLabel} details in the current filter.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Button className="rounded-lg" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-lg">
                  Change filters
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {FOCUS_OPTIONS.filter((f) => f.value !== focus).map((opt) => (
                  <DropdownMenuItem key={opt.value} onClick={() => { setFocus(opt.value); setCurrentIdx(0); }}>
                    Focus: {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* ── State C: Mark as Not Available dialog ── */}
      <Dialog open={naDialog.open} onOpenChange={(open) => setNaDialog({ open })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {naDialog.fieldKey
                ? `Mark ${ALL_FIELDS.find((f) => f.key === naDialog.fieldKey)?.label ?? "field"} as not available?`
                : "Mark selected fields as not available?"}
            </DialogTitle>
            <DialogDescription>
              Use this when information cannot be collected right now, but you want to stop it blocking completion metrics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Reason</Label>
              <RadioGroup value={naReason} onValueChange={setNaReason} className="mt-2">
                {NA_REASONS.map((reason) => (
                  <div key={reason} className="flex items-center gap-2">
                    <RadioGroupItem value={reason} id={`na-${reason}`} />
                    <Label htmlFor={`na-${reason}`} className="text-sm font-normal cursor-pointer">
                      {reason}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {naReason === "Other (specify)" && (
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                  value={naNotes}
                  onChange={(e) => setNaNotes(e.target.value)}
                  placeholder="Describe why this information is not available..."
                  className="mt-1 h-20 text-sm"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setNaDialog({ open: false })}>
              Cancel
            </Button>
            <Button size="sm" className="rounded-lg" onClick={confirmNa}>
              Confirm &amp; continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
