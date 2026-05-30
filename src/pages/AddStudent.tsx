import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GraduationCap, ArrowLeft, Save, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { StickyActionBar } from "@/components/StickyActionBar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteStudentRecord,
  fetchStudentFormValues,
  formatDataError,
  saveStudentRecord,
  type StudentFormValues,
} from "@/lib/student-records";
import { buildRegistrySections, getHeaderFieldMeta, invalidateRegistryCache, loadCustomImportFields, loadHeaderRegistrySettings, registryStorageKey } from "@/lib/header-registry";
import { importStorageKeys } from "@/lib/student-import";
import { subscribeAppSync } from "@/lib/app-sync";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useStudentCapability } from "@/hooks/useStudentCapability";
import { traceStudentFieldChange, traceStudentAction } from "@/lib/student-workspace-messaging";

export default function AddStudent() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { canEdit, profileId } = useStudentCapability();
  const canDeleteStudent = profileId === "admin";
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [registrySettings, setRegistrySettings] = useState(() => loadHeaderRegistrySettings());
  const [customFields, setCustomFields] = useState(() => loadCustomImportFields());
  const studentQuery = useQuery({
    queryKey: ["student-form", studentId],
    queryFn: () => fetchStudentFormValues(studentId as string),
    enabled: Boolean(studentId),
  });

  const sections = useMemo(
    () => buildRegistrySections(customFields, registrySettings).filter((section) => section.enabled),
    [customFields, registrySettings]
  );

  useEffect(() => {
    if (studentQuery.data) {
      setValues(studentQuery.data);
    }
  }, [studentQuery.data]);

  useEffect(() => {
    return subscribeAppSync([registryStorageKey, importStorageKeys.customFields, importStorageKeys.profiles], () => {
      setRegistrySettings(loadHeaderRegistrySettings());
      setCustomFields(loadCustomImportFields());
    });
  }, []);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));
  const reset = () => { setValues({}); toast.info("Form reset"); };
  const refreshRegistry = () => {
    invalidateRegistryCache();
    setRegistrySettings(loadHeaderRegistrySettings());
    setCustomFields(loadCustomImportFields());
    toast.success("Header registry refreshed");
  };
  const save = async () => {
    if (submitting || !canEdit) return;
    setSubmitting(true);
    try {
      await saveStudentRecord(values);
      traceStudentAction(studentId ? "Student record updated" : "Student record created");
      const changed = Object.entries(values).filter(([, v]) => v);
      changed.slice(0, 5).forEach(([k, v]) => traceStudentFieldChange(k, v));
      toast.success("Student saved to register");
      setTimeout(() => navigate("/students"), 600);
    } catch (error) {
      toast.error(formatDataError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("No student is loaded for deletion");
      return deleteStudentRecord(studentId);
    },
    onSuccess: () => {
      toast.success("Student deleted permanently");
      navigate("/students");
    },
    onError: (error) => {
      toast.error(formatDataError(error));
      setDeleting(false);
    },
  });

  return (
    <div>
      <PageHeader
        title="Add Student"
        subtitle="Manually register a student with grouped sections and custom fields"
        icon={<GraduationCap className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={refreshRegistry}>
              Refresh Registry
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/students"><ArrowLeft className="mr-2 h-4 w-4" />Back to Register</Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {studentQuery.isLoading && (
          <Card className="glass flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading student record…
          </Card>
        )}

        {studentQuery.isError && (
          <Card className="glass border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">Student record could not load.</p>
            <p className="mt-1">{formatDataError(studentQuery.error)}</p>
          </Card>
        )}

        {sections.map((sec) => (
          <Card key={sec.title} className="glass p-5">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">{sec.title}</h3>
                {sec.description && <p className="text-xs text-muted-foreground">{sec.description}</p>}
              </div>
              <Badge variant="secondary" className="text-[10px]">{sec.fields.length} fields</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sec.fields.map((f) => {
                const meta = getHeaderFieldMeta(f.name);
                return (
                <div key={f.name} className={`flex flex-col gap-1.5 ${f.col === 3 ? "lg:col-span-3 sm:col-span-2" : ""}`}>
                  <Label htmlFor={f.name} className="text-xs">
                    {f.label}{f.required && <span className="text-destructive ml-1">*</span>}
                    {meta?.source && <span className="text-[10px] text-muted-foreground ml-2 opacity-60">({meta.source})</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea id={f.name} value={values[f.name] || ""} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} rows={3} />
                  ) : f.type === "select" ? (
                    <Select value={values[f.name] || ""} onValueChange={(v) => set(f.name, v)}>
                      <SelectTrigger id={f.name}><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id={f.name} type={f.type || "text"} value={values[f.name] || ""} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
                  )}
                </div>
              );
              })}
            </div>
          </Card>
        ))}
      </div>

      <StickyActionBar className="justify-end">
        {studentId && canDeleteStudent && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={deleting || deleteMutation.isPending}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this student permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the student record and all linked register data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleting(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setDeleting(true);
                    deleteMutation.mutate();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button variant="outline" onClick={reset} className="rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
        <Button onClick={save} disabled={submitting} className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {submitting ? "Saving…" : "Save Student"}
        </Button>
      </StickyActionBar>
    </div>
  );
}
