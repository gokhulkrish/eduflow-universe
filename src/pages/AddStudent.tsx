import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowLeft, Save, RotateCcw, Trash2, Users, Sparkles } from "lucide-react";
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

type SectionDef = {
  title: string;
  description?: string;
  fields: { name: string; label: string; type?: "text" | "date" | "email" | "tel" | "number" | "textarea" | "select"; options?: string[]; placeholder?: string; col?: 1 | 2 | 3 }[];
};

// Merged from legacy `customStudentFields` builder — flattened to a clean, static schema.
const sections: SectionDef[] = [
  {
    title: "Personal Information",
    description: "Core identity captured for the SMS register.",
    fields: [
      { name: "firstName", label: "First Name", placeholder: "Aarav" },
      { name: "lastName", label: "Last Name", placeholder: "Sharma" },
      { name: "dob", label: "Date of Birth", type: "date" },
      { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other", "Prefer not to say"] },
      { name: "bloodGroup", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      { name: "nationality", label: "Nationality", placeholder: "Indian" },
    ],
  },
  {
    title: "Academic Details",
    description: "Grade, roll number, section assignment.",
    fields: [
      { name: "admissionNo", label: "Admission No", placeholder: "ADM-2026-0184" },
      { name: "grade", label: "Grade", type: "select", options: ["Pre-KG", "KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
      { name: "section", label: "Section", type: "select", options: ["A", "B", "C", "D"] },
      { name: "roll", label: "Roll Number", type: "number" },
      { name: "stream", label: "Stream", type: "select", options: ["Science", "Commerce", "Arts", "Vocational", "N/A"] },
      { name: "house", label: "House", type: "select", options: ["Red", "Blue", "Green", "Yellow"] },
    ],
  },
  {
    title: "Contact & Address",
    fields: [
      { name: "email", label: "Email", type: "email", placeholder: "student@school.edu" },
      { name: "phone", label: "Phone", type: "tel", placeholder: "+91 98765 43210" },
      { name: "alternatePhone", label: "Alternate Phone", type: "tel" },
      { name: "address", label: "Address", type: "textarea", col: 3, placeholder: "Street, Area, City, State, PIN" },
    ],
  },
  {
    title: "Guardian Information",
    fields: [
      { name: "fatherName", label: "Father's Name" },
      { name: "fatherOccupation", label: "Father's Occupation" },
      { name: "motherName", label: "Mother's Name" },
      { name: "motherOccupation", label: "Mother's Occupation" },
      { name: "guardianPhone", label: "Guardian Phone", type: "tel" },
      { name: "annualIncome", label: "Annual Income", type: "number", placeholder: "₹" },
    ],
  },
  {
    title: "UMIS / EMIS Context",
    description: "Optional — auto-filled when the student is imported from UMIS.",
    fields: [
      { name: "umisId", label: "UMIS ID" },
      { name: "emisId", label: "EMIS ID" },
      { name: "district", label: "District" },
      { name: "block", label: "Block" },
    ],
  },
  {
    title: "Verification & Scholarship",
    description: "Community, first graduate, income verification (Scholarship module-aligned).",
    fields: [
      { name: "community", label: "Community", type: "select", options: ["OC", "BC", "MBC", "SC", "ST", "Other"] },
      { name: "firstGraduate", label: "First Graduate", type: "select", options: ["Yes", "No"] },
      { name: "incomeVerified", label: "Income Verified", type: "select", options: ["Pending", "Agreed", "Appealed"] },
      { name: "scholarshipNotes", label: "Notes", type: "textarea", col: 3 },
    ],
  },
];

export default function AddStudent() {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));
  const reset = () => { setValues({}); toast.info("Form reset"); };
  const save = () => {
    toast.success("Student saved to register");
    setTimeout(() => navigate("/students"), 600);
  };

  return (
    <div>
      <PageHeader
        title="Add Student"
        subtitle="Manually register a student with grouped sections and custom fields"
        icon={<GraduationCap className="h-6 w-6" />}
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/students"><ArrowLeft className="mr-2 h-4 w-4" />Back to Register</Link>
          </Button>
        }
      />

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
        <Button onClick={save} className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
          <Save className="mr-2 h-4 w-4" /> Save Student
        </Button>
        <Button variant="outline" onClick={reset} className="rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
        <Button variant="ghost" className="ml-auto rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
    </div>
  );
}
