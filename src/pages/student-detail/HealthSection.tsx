import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Save } from "lucide-react";
import { fetchStudentFormValues, saveStudentRecord } from "@/lib/student-records";
import { toast } from "sonner";

interface Props { studentId: string; }

const HEALTH_FIELDS = [
  { key: "bloodGroup", label: "Blood Group", type: "text", placeholder: "e.g. O+" },
  { key: "nationality", label: "Nationality", type: "text" },
] as const;

export default function HealthSection({ studentId }: Props) {
  const query = useQuery({
    queryKey: ["student-form", studentId],
    queryFn: () => fetchStudentFormValues(studentId),
    enabled: Boolean(studentId),
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (query.data) setValues((prev) => ({ ...prev, ...query.data }));
  }, [query.data]);

  const hasChanges = useMemo(
    () => query.data && HEALTH_FIELDS.some((f) => values[f.key] !== (query.data?.[f.key] ?? "")),
    [query.data, values],
  );

  const save = async () => {
    if (!query.data || saving) return;
    setSaving(true);
    try {
      await saveStudentRecord({ ...query.data, ...values });
      toast.success("Health details saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading) return <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;
  if (query.isError) return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Could not load student data.</div>;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Health Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {HEALTH_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label htmlFor={f.key} className="text-xs">{f.label}</Label>
              <Input id={f.key} type={f.type} value={values[f.key] || ""} onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))} placeholder={"placeholder" in f ? f.placeholder : ""} />
            </div>
          ))}
        </div>
        {hasChanges && (
          <Button onClick={save} disabled={saving} className="mt-4 rounded-xl" size="sm">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
