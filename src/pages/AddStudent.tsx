import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, ArrowLeft, Save, RotateCcw, Trash2, Users, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
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
  studentSections,
  type StudentFormValues,
} from "@/lib/student-records";
import { toast } from "sonner";

export default function AddStudent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { studentId } = useParams();
  const isEdit = Boolean(studentId);
  const [values, setValues] = useState<StudentFormValues>({});

  const studentQuery = useQuery({
    queryKey: ["student-form", studentId],
    queryFn: () => fetchStudentFormValues(studentId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (studentQuery.data) setValues(studentQuery.data);
  }, [studentQuery.data]);

  const saveMutation = useMutation({
    mutationFn: saveStudentRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-register"] });
      queryClient.invalidateQueries({ queryKey: ["student-form", studentId] });
      toast.success(isEdit ? "Student record updated" : "Student saved to register");
      setTimeout(() => navigate("/students"), 500);
    },
    onError: (error) => toast.error(formatDataError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudentRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-register"] });
      toast.success("Student record deleted");
      navigate("/students");
    },
    onError: (error) => toast.error(formatDataError(error)),
  });

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));
  const reset = () => {
    setValues(studentQuery.data ?? {});
    toast.info("Form reset");
  };
  const save = () => {
    saveMutation.mutate({ ...values, ...(studentId ? { studentId } : {}) });
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Student" : "Add Student"}
        subtitle={isEdit ? "Update the normalized people and academic enrollment record" : "Register a student with grouped sections and custom fields"}
        icon={<GraduationCap className="h-6 w-6" />}
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/students"><ArrowLeft className="mr-2 h-4 w-4" />Back to Register</Link>
          </Button>
        }
      />

      {/* Reference cards (merged from erp-reference-grid) */}
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          { title: "Registered Student Edit Flow", body: "Open an existing student record from the register and edit section values safely." , link: { to: "/students", label: "Open Register" }, icon: Users },
          { title: "Add with UMIS / EMIS Context", body: "Manual intake plus UMIS/EMIS-backed lookup context for existing students.", icon: Sparkles },
          { title: "Verification & Scholarship Actions", body: "Community, first graduate, income verification, Agree/Appeal actions.", icon: GraduationCap },
        ].map((r) => (
          <Card key={r.title} className="glass p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <r.icon className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-semibold">{r.title}</p>
            </div>
            <p className="text-xs text-muted-foreground">{r.body}</p>
            {r.link && (
              <Button asChild variant="link" className="mt-1 h-auto px-0 text-xs">
                <Link to={r.link.to}>{r.link.label} →</Link>
              </Button>
            )}
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {studentQuery.isLoading && (
          <Card className="glass flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading student record…
          </Card>
        )}

        {studentSections.map((sec) => (
          <Card key={sec.title} className="glass p-5">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">{sec.title}</h3>
                {sec.description && <p className="text-xs text-muted-foreground">{sec.description}</p>}
              </div>
              <Badge variant="secondary" className="text-[10px]">{sec.fields.length} fields</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sec.fields.map((f) => (
                <div key={f.name} className={`flex flex-col gap-1.5 ${f.col === 3 ? "lg:col-span-3 sm:col-span-2" : ""}`}>
                  <Label htmlFor={f.name} className="text-xs">{f.label}</Label>
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
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4 mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-elegant backdrop-blur">
        <Button onClick={save} disabled={saveMutation.isPending || studentQuery.isLoading} className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
          {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEdit ? "Update Student" : "Save Student"}
        </Button>
        <Button variant="outline" onClick={reset} className="rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
        {isEdit && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="ml-auto rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this student?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the student profile and cascades linked enrollments and guardian relationships.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => studentId && deleteMutation.mutate(studentId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
