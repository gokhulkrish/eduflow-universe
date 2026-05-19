import { useState } from "react";
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle,
  Sparkles, Database, KeyRound, ShieldCheck, Eye, Send, Cog,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: "create", title: "Create Batch", icon: FileSpreadsheet, caption: "Identity + upload" },
  { id: "map", title: "Schema Mapping", icon: Cog, caption: "Map source → target" },
  { id: "key", title: "Keying", icon: KeyRound, caption: "Match design" },
  { id: "dupe", title: "Duplicates", icon: Database, caption: "Resolve conflicts" },
  { id: "validate", title: "Validation", icon: ShieldCheck, caption: "Review issues" },
  { id: "preview", title: "Preview", icon: Eye, caption: "Diff before commit" },
  { id: "transfer", title: "Transfer", icon: Send, caption: "Commit to register" },
] as const;

const transferRules = [
  "New Entry Only",
  "Update Existing Only",
  "Insert New, Ignore Existing",
  "Update If Blank",
  "Overwrite Always (Safe)",
  "Overwrite Including Blanks",
  "Reject If Changed",
  "Skip If Changed",
];

const matchDesigns = [
  { v: "reg_umis_emis", l: "Registration / UMIS / EMIS (recommended)" },
  { v: "registration_only", l: "Registration Number Only" },
  { v: "umis_only", l: "UMIS ID Only" },
  { v: "name_dob", l: "Name + Date of Birth (exact)" },
  { v: "fuzzy_name_dob", l: "Fuzzy Name + DOB (similarity)" },
  { v: "reg_or_name_dob", l: "Registration OR Name + DOB" },
];

const sampleSourceCols = ["First Name", "Last Name", "DOB", "Grade", "Roll No", "Mobile", "UMIS_ID", "Address Line"];
const targetCols = ["firstName", "lastName", "dob", "grade", "roll", "phone", "umisId", "address"];

const sampleDuplicates = [
  { source: "Aarav Sharma · 2010-04-12", existing: "STU-2041 · Aarav Sharma", confidence: 98, action: "merge" },
  { source: "Meilin Chen · 2011-06-30", existing: "STU-2042 · Mei Lin Chen", confidence: 87, action: "review" },
  { source: "Liam Obrien · 2009-11-02", existing: "STU-2043 · Liam O'Brien", confidence: 92, action: "merge" },
];

const savedPresets = [
  { name: "UMIS Scholarship Intake", rule: "Update If Blank", design: "reg_umis_emis" },
  { name: "Annual Promotion Roster", rule: "Overwrite Always (Safe)", design: "registration_only" },
  { name: "New Admission Batch", rule: "New Entry Only", design: "name_dob" },
];

export default function Import() {
  const [step, setStep] = useState(0);
  const [batch, setBatch] = useState({ name: "", desc: "", rule: "Update If Blank", design: "reg_umis_emis", threshold: 88 });
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>(
    Object.fromEntries(sampleSourceCols.map((c, i) => [c, targetCols[i] || "—"]))
  );

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  const Active = STEPS[step].icon;

  return (
    <div>
      <PageHeader
        title="Import Pipeline"
        subtitle="Upload → Map → Dedupe → Commit · single guided flow"
        icon={<Upload className="h-6 w-6" />}
        actions={
          <Button variant="outline" className="rounded-xl" onClick={() => toast.info("AI Assistant opened")}>
            <Sparkles className="mr-2 h-4 w-4" /> AI Assist
          </Button>
        }
      />

      {/* Stepper */}
      <Card className="glass mb-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => {
            const active = i === step;
            const done = i < step;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={cn(
                  "group flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                  active && "border-primary bg-primary/10 shadow-glow",
                  done && !active && "border-success/40 bg-success/5",
                  !active && !done && "border-border/60 bg-card/40 hover:bg-secondary/60"
                )}
              >
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                  active ? "bg-gradient-primary text-primary-foreground" : done ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground")}>
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {i + 1}</span>
                  <span className="text-xs font-semibold">{s.title}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{STEPS[step].title} · {STEPS[step].caption}</span>
            <span className="font-mono">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
      </Card>

      {/* Step body */}
      <Card className="glass p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Active className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold">{STEPS[step].title}</h3>
            <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label>Batch Name</Label>
                <Input value={batch.name} onChange={(e) => setBatch({ ...batch, name: e.target.value })} placeholder="Example: Scholarship Batch March 2026" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <Textarea rows={3} value={batch.desc} onChange={(e) => setBatch({ ...batch, desc: e.target.value })} placeholder="Source, timing, or purpose" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Default Transfer Rule</Label>
                <Select value={batch.rule} onValueChange={(v) => setBatch({ ...batch, rule: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{transferRules.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Default Match Design</Label>
                <Select value={batch.design} onValueChange={(v) => setBatch({ ...batch, design: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{matchDesigns.map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {batch.design === "fuzzy_name_dob" && (
                <div className="rounded-xl border bg-card/60 p-3">
                  <Label className="text-xs">Fuzzy Threshold: {batch.threshold}%</Label>
                  <Slider value={[batch.threshold]} min={70} max={100} step={1} onValueChange={(v) => setBatch({ ...batch, threshold: v[0] })} className="mt-2" />
                </div>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Upload Source File</Label>
              <label className="flex h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 transition-colors hover:border-primary hover:bg-primary/5">
                <Upload className="h-8 w-8 text-primary" />
                <p className="text-sm font-semibold">{file ? file.name : "Drop UMIS Excel or CSV here"}</p>
                <p className="text-xs text-muted-foreground">.xlsx · .xls · .csv</p>
                <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>

              <div className="mt-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Saved Presets</p>
                <div className="space-y-1.5">
                  {savedPresets.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => { setBatch({ ...batch, rule: p.rule, design: p.design }); toast.success(`Preset "${p.name}" applied`); }}
                      className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-left text-xs hover:bg-secondary/60"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{p.rule}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <p className="mb-3 text-xs text-muted-foreground">AI-suggested mappings · click a target to remap.</p>
            {sampleSourceCols.map((src) => (
              <div key={src} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                <span className="font-mono text-xs">{src}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={mapping[src]} onValueChange={(v) => setMapping({ ...mapping, [src]: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="—">— Ignore —</SelectItem>
                    {targetCols.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Match design from Step 1 carries over. Refine with custom key sets here.</p>
            <Card className="border-border/60 bg-card/60 p-4">
              <p className="text-sm font-semibold">Active match design</p>
              <p className="mt-1 font-mono text-xs text-primary">{matchDesigns.find((m) => m.v === batch.design)?.l}</p>
            </Card>
            <div className="grid gap-2 sm:grid-cols-3">
              {["Registration Number", "UMIS ID", "EMIS ID", "Name + DOB", "Mobile", "Aadhaar"].map((k) => (
                <button key={k} className="rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary">+ {k}</button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">3 potential duplicates detected</span>
              <Badge variant="secondary" className="bg-warning/15 text-warning">Review required</Badge>
            </div>
            {sampleDuplicates.map((d, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:grid-cols-[1fr_1fr_auto]">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Source row</p>
                  <p className="text-sm font-medium">{d.source}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Existing record</p>
                  <p className="text-sm font-medium">{d.existing}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={d.confidence > 95 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
                    {d.confidence}% match
                  </Badge>
                  <Select defaultValue={d.action}>
                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merge">Merge</SelectItem>
                      <SelectItem value="skip">Skip</SelectItem>
                      <SelectItem value="insert">Insert New</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            {[
              { label: "Rows parsed", value: "1,284", state: "ok" },
              { label: "Schema valid", value: "1,278", state: "ok" },
              { label: "Date format warnings", value: "4", state: "warn" },
              { label: "Missing required fields", value: "2", state: "warn" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-3">
                <div className="flex items-center gap-2">
                  {r.state === "warn" ? <AlertTriangle className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
                  <span className="text-sm">{r.label}</span>
                </div>
                <span className="font-mono text-sm font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Insert new", value: 412, color: "text-success" },
              { label: "Update existing", value: 866, color: "text-primary" },
              { label: "Skipped", value: 6, color: "text-muted-foreground" },
            ].map((b) => (
              <Card key={b.label} className="glass p-4 text-center">
                <p className={`font-display text-3xl font-bold ${b.color}`}>{b.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{b.label}</p>
              </Card>
            ))}
            <p className="sm:col-span-3 text-xs text-muted-foreground">Preview shows the diff that will be committed. Nothing has been written to the register yet.</p>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h4 className="font-display text-xl font-semibold">Ready to transfer</h4>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Commit 1,278 records to the student register using rule <span className="font-mono text-primary">{batch.rule}</span>.
              This action is logged in the Activity Trace.
            </p>
            <Button onClick={() => toast.success("Transfer started · streaming to register")} className="mx-auto rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
              <Send className="mr-2 h-4 w-4" /> Commit Transfer
            </Button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
          <Button variant="outline" onClick={prev} disabled={step === 0} className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={next} disabled={step === STEPS.length - 1} className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
