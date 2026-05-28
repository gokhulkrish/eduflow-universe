import { useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { fetchStudentRegister, type StudentRegisterRow } from "@/lib/student-records";
import { toast } from "sonner";

const ACTIONS: Record<string, { label: string; target: string; options?: string[]; placeholder?: string; description: string }> = {
  class: {
    label: "Program / Semester",
    target: "grade_label",
    options: ["B.A. Sem 1", "B.A. Sem 2", "B.Com Sem 1", "B.Com Sem 2", "B.Sc Sem 1", "B.Sc Sem 2", "BBA Sem 1", "BBA Sem 2"],
    description: "Assign all selected students to a program or semester",
  },
  section: {
    label: "Section",
    target: "section_label",
    options: ["A", "B", "C", "D"],
    description: "Assign all selected students to a section",
  },
  mentor: {
    label: "Mentor Name",
    target: "meta",
    placeholder: "Enter mentor name",
    description: "Assign a mentor to all selected students",
  },
  "subject-group": {
    label: "Subject Group",
    target: "meta",
    placeholder: "e.g. Science Core, Commerce Elective",
    description: "Assign a subject group to all selected students",
  },
  route: {
    label: "Transport Route",
    target: "meta",
    placeholder: "e.g. Route 7, North Campus Shuttle",
    description: "Assign a transport route to all selected students",
  },
  hostel: {
    label: "Hostel",
    target: "meta",
    options: ["Boys Hostel A", "Boys Hostel B", "Girls Hostel A", "Girls Hostel B", "International Hostel"],
    description: "Assign a hostel to all selected students",
  },
  "fee-plan": {
    label: "Fee Plan",
    target: "meta",
    options: ["Annual", "Semester-wise", "Quarterly", "Monthly", "Scholarship Holders"],
    description: "Assign a fee plan to all selected students",
  },
};

const META_PATH: Record<string, string[]> = {
  mentor: ["academic", "mentor"],
  "subject-group": ["academic", "subjectGroup"],
  route: ["transport", "route"],
  hostel: ["hostel", "name"],
  "fee-plan": ["fees", "feePlan"],
};

function setNestedMeta(meta: Record<string, unknown>, path: string[], value: string): Record<string, unknown> {
  const result = { ...meta };
  let current = result;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!current[segment] || typeof current[segment] !== "object") {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
  return result;
}

export default function BulkAssign() {
  const { action } = useParams<{ action: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ids = useMemo(() => searchParams.get("ids")?.split(",").filter(Boolean) ?? [], [searchParams]);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const def = action ? ACTIONS[action] : null;

  const studentsQuery = useQuery({
    queryKey: ["student-register"],
    queryFn: fetchStudentRegister,
  });

  const selectedStudents = useMemo(() => {
    if (!studentsQuery.data) return [];
    const idSet = new Set(ids);
    return studentsQuery.data.filter((s) => idSet.has(s.id));
  }, [studentsQuery.data, ids]);

  if (!def) {
    return (
      <div>
        <PageHeader title="Bulk Assign" subtitle="Unknown action" icon={<Users className="h-6 w-6" />} />
        <Card className="border-border/40 p-6 text-sm text-muted-foreground">
          Unknown assign action "{action}". <Link to="/students" className="text-primary underline">Back to Students</Link>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!value.trim() || submitting || ids.length === 0) return;
    setSubmitting(true);
    let success = 0;
    let failed = 0;

    try {
      if (def.target === "meta") {
        const metaPath = META_PATH[action!];
        for (const id of ids) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: student, error: fetchErr } = await (supabase.from("students") as any)
            .select("meta")
            .eq("id", id)
            .single();
          if (fetchErr || !student) { failed++; continue; }
          const meta = student.meta && typeof student.meta === "object" && !Array.isArray(student.meta)
            ? { ...student.meta as Record<string, unknown> }
            : {};
          const updated = setNestedMeta(meta, metaPath, value.trim());
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateErr } = await (supabase.from("students") as any)
            .update({ meta: updated })
            .eq("id", id);
          if (updateErr) failed++;
          else success++;
        }
      } else if (def.target === "grade_label" || def.target === "section_label") {
        const col = def.target;
        for (const id of ids) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: fetchErr } = await (supabase.from("enrollments") as any)
            .update({ [col]: value.trim() })
            .eq("student_id", id);
          if (fetchErr) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: insertErr } = await (supabase.from("enrollments") as any)
              .insert({ student_id: id, [col]: value.trim() });
            if (insertErr) failed++;
            else success++;
          } else success++;
        }
      }

      if (success > 0) toast.success(`${success} student(s) updated`);
      if (failed > 0) toast.error(`${failed} student(s) failed`);
      if (success > 0) navigate("/students");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Bulk Assign: ${def.label}`}
        subtitle={def.description}
        icon={<Users className="h-6 w-6" />}
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/students"><ArrowLeft className="mr-2 h-4 w-4" />Back to Students</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Assign Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">{def.label}</Label>
                {def.options ? (
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger><SelectValue placeholder={`Select ${def.label}…`} /></SelectTrigger>
                    <SelectContent>
                      {def.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={def.placeholder ?? `Enter ${def.label}`} />
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!value.trim() || submitting || ids.length === 0}
                  className="rounded-xl"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {submitting ? "Assigning…" : `Assign to ${ids.length} student(s)`}
                </Button>
                <Button variant="ghost" className="rounded-xl text-muted-foreground" onClick={() => navigate("/students")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Affected Students</CardTitle>
                <Badge variant="secondary" className="text-[10px]">{selectedStudents.length} selected</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {selectedStudents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No students matched the given IDs.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {selectedStudents.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-1.5">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{s.display_name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.admission_no} · {s.grade ?? "—"} · {s.section ?? "—"}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight text-muted-foreground shrink-0 ml-2">
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Action</span><span className="font-medium text-foreground">{def.label}</span></div>
              <Separator />
              <div className="flex justify-between"><span>Students</span><span className="font-medium text-foreground">{ids.length}</span></div>
              <Separator />
              <div className="flex justify-between"><span>Target</span><span className="font-medium text-foreground">{def.target === "meta" ? "Student meta" : def.target}</span></div>
              {value && (
                <>
                  <Separator />
                  <div className="flex justify-between"><span>Value</span><span className="font-medium text-foreground truncate max-w-[140px]">{value}</span></div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
