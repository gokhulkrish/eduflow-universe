import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowLeft, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type SectionDef = {
  title: string;
  description?: string;
  fields: { name: string; label: string; type?: "text"|"date"|"email"|"tel"|"number"|"textarea"|"select"; options?: string[]; placeholder?: string; col?: 1|2|3; required?: boolean }[];
};

const sections: SectionDef[] = [
  { title: "Personal Information", description: "Core identity captured for the SMS register.", fields: [
    { name: "first_name", label: "First Name", placeholder: "Aarav", required: true },
    { name: "last_name", label: "Last Name", placeholder: "Sharma" },
    { name: "dob", label: "Date of Birth", type: "date" },
    { name: "gender", label: "Gender", type: "select", options: ["Male","Female","Other"] },
    { name: "blood_group", label: "Blood Group", type: "select", options: ["A+","A-","B+","B-","O+","O-","AB+","AB-"] },
    { name: "nationality", label: "Nationality", placeholder: "Indian" },
  ]},
  { title: "Academic / Admission", fields: [
    { name: "admission_no", label: "Admission No", placeholder: "ADM-2026-0184", required: true },
    { name: "house", label: "House", type: "select", options: ["Red","Blue","Green","Yellow"] },
  ]},
  { title: "Contact & Address", fields: [
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "alternate_phone", label: "Alternate Phone", type: "tel" },
    { name: "address", label: "Address", type: "textarea", col: 3 },
  ]},
  { title: "Guardian Information", fields: [
    { name: "father_name", label: "Father's Name" },
    { name: "father_occupation", label: "Father's Occupation" },
    { name: "mother_name", label: "Mother's Name" },
    { name: "mother_occupation", label: "Mother's Occupation" },
    { name: "guardian_phone", label: "Guardian Phone", type: "tel" },
    { name: "annual_income", label: "Annual Income (₹)", type: "number" },
  ]},
  { title: "UMIS / EMIS Context", fields: [
    { name: "umis_id", label: "UMIS ID" },
    { name: "emis_id", label: "EMIS ID" },
    { name: "district", label: "District" },
    { name: "block", label: "Block" },
  ]},
  { title: "Verification & Scholarship", fields: [
    { name: "community", label: "Community", type: "select", options: ["OC","BC","MBC","SC","ST","Other"] },
    { name: "first_graduate", label: "First Graduate", type: "select", options: ["Yes","No"] },
    { name: "income_verified", label: "Income Verified", type: "select", options: ["Pending","Agreed","Appealed"] },
    { name: "notes", label: "Notes", type: "textarea", col: 3 },
  ]},
];

export default function AddStudent() {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));
  const reset = () => { setValues({}); toast.info("Form reset"); };

  const save = async () => {
    if (!values.first_name || !values.admission_no) {
      toast.error("First name and Admission No are required");
      return;
    }
    setSaving(true);
    const payload: any = { ...values };
    if (payload.first_graduate) payload.first_graduate = payload.first_graduate === "Yes";
    if (payload.annual_income) payload.annual_income = Number(payload.annual_income);
    if (!payload.dob) delete payload.dob;
    const { error } = await supabase.from("students").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Student saved to register");
    setTimeout(() => navigate("/students"), 500);
  };

  return (
    <div>
      <PageHeader
        title="Add Student"
        subtitle="Manually register a student into the live database"
        icon={<GraduationCap className="h-6 w-6" />}
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/students"><ArrowLeft className="mr-2 h-4 w-4" />Back to Register</Link>
          </Button>
        }
      />

      <div className="space-y-4">
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
              {sec.fields.map((f) => (
                <div key={f.name} className={`flex flex-col gap-1.5 ${f.col === 3 ? "lg:col-span-3 sm:col-span-2" : ""}`}>
                  <Label htmlFor={f.name} className="text-xs">
                    {f.label}{f.required && <span className="text-destructive ml-1">*</span>}
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
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4 mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-elegant backdrop-blur">
        <Button onClick={save} disabled={saving} className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
          <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save Student"}
        </Button>
        <Button variant="outline" onClick={reset} className="rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
}
