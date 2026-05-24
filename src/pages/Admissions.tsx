import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap, Search, Plus, Download, Filter, ChevronDown, CheckCircle2, XCircle,
  Eye, Send, UserCheck, Award, Loader2, AlertTriangle, ArrowRight, FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { toast } from "sonner";
import {
  fetchAdmissionApplicants, fetchAdmissionSummary, updateAdmissionStage, createAdmissionApplication,
  canTransition, ADMISSION_STAGES, STAGE_ORDER,
  type AdmissionApplicant, type AdmissionStage,
} from "@/lib/admissions";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

const stageColor = (stage: AdmissionStage) =>
  ADMISSION_STAGES.find((s) => s.value === stage)?.color ?? "bg-muted text-muted-foreground";

const stageLabel = (stage: AdmissionStage) =>
  ADMISSION_STAGES.find((s) => s.value === stage)?.label ?? stage;

const getNextStages = (current: AdmissionStage): AdmissionStage[] => {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return [];
  return STAGE_ORDER.slice(idx + 1);
};

export default function Admissions() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<AdmissionStage | "all">("all");
  const [actionTarget, setActionTarget] = useState<AdmissionApplicant | null>(null);
  const [actionStage, setActionStage] = useState<AdmissionStage | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  const applicantsQuery = useQuery({
    queryKey: ["admission-applicants"],
    queryFn: fetchAdmissionApplicants,
  });

  const summaryQuery = useQuery({
    queryKey: ["admission-summary"],
    queryFn: fetchAdmissionSummary,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, stage, notes }: { id: string; stage: AdmissionStage; notes?: string }) => {
      await updateAdmissionStage(id, stage, notes ? { notes } : undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-applicants"] });
      qc.invalidateQueries({ queryKey: ["admission-summary"] });
      toast.success(`Applicant moved to ${stageLabel(actionStage ?? "enrolled")}`);
      setActionTarget(null);
      setActionStage(null);
      setActionNotes("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const applicants = applicantsQuery.data ?? [];

  const filtered = useMemo(() => {
    let result = applicants;
    if (stageFilter !== "all") result = result.filter((a) => a.stage === stageFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.display_name.toLowerCase().includes(q) ||
          a.admission_no.toLowerCase().includes(q) ||
          (a.email ?? "").toLowerCase().includes(q) ||
          (a.phone ?? "").includes(q)
      );
    }
    return result;
  }, [applicants, stageFilter, search]);

  const pag = usePagination({ data: filtered, pageSize: 10 });

  const summary = summaryQuery.data ?? {
    total: 0, new: 0, screening: 0, verified: 0,
    shortlisted: 0, offered: 0, enrolled: 0, rejected: 0,
  };

  const pipelineProgress = summary.total
    ? Math.round(
        ((summary.verified + summary.shortlisted + summary.offered + summary.enrolled) /
          Math.max(1, summary.total)) * 100
      )
    : 0;

  const initAdvance = (applicant: AdmissionApplicant, stage: AdmissionStage) => {
    if (canTransition(applicant.stage, stage)) {
      setActionTarget(applicant);
      setActionStage(stage);
      setActionNotes("");
    } else {
      toast.error(`Cannot move from ${stageLabel(applicant.stage)} to ${stageLabel(stage)}`);
    }
  };

  const confirmAdvance = () => {
    if (!actionTarget || !actionStage) return;
    updateMutation.mutate({ id: actionTarget.id, stage: actionStage, notes: actionNotes || undefined });
  };

  return (
    <div>
      <PageHeader
        title="Admissions Portal"
        subtitle="Application intake · verification · merit list · offer letters · enrollment"
        icon={<GraduationCap className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Admissions exported")}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90" onClick={() => toast.success("New application form opened")}>
              <Plus className="mr-2 h-4 w-4" /> New Application
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          { label: "Total Applications", value: summary.total, color: "text-primary" },
          { label: "Pending Review", value: summary.new + summary.screening, color: "text-warning" },
          { label: "Shortlisted", value: summary.shortlisted, color: "text-accent-foreground" },
          { label: "Enrolled", value: summary.enrolled, color: "text-success" },
        ].map((k) => (
          <Card key={k.label} className="glass p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className={`mt-1 font-display text-3xl font-bold ${k.color}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <Card className="glass mb-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Admission Pipeline</span>
          </div>
          <Badge variant="secondary">{pipelineProgress}% complete</Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {STAGE_ORDER.map((stage, i) => {
            const count = summary[stage];
            const active = i <= STAGE_ORDER.indexOf(summary.offered > 0 ? "offered" : summary.shortlisted > 0 ? "shortlisted" : summary.verified > 0 ? "verified" : "new");
            return (
              <div key={stage} className="flex items-center gap-2">
                <div className={`flex min-w-[5.5rem] flex-1 flex-col items-center rounded-xl border px-3 py-2 sm:min-w-[6.5rem] sm:flex-none ${active ? "border-primary/40 bg-primary/10" : "border-border/60 bg-card/60"}`}>
                  <span className={`text-xs font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>{count}</span>
                  <span className="text-[10px] text-muted-foreground">{stageLabel(stage)}</span>
                </div>
                {i < STAGE_ORDER.length - 1 && <ArrowRight className="hidden h-3 w-3 text-muted-foreground sm:block" />}
              </div>
            );
          })}
        </div>
        <Progress value={pipelineProgress} className="mt-3 h-1.5" />
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 w-full flex-nowrap overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="new">New ({summary.new})</TabsTrigger>
          <TabsTrigger value="screening">Screening ({summary.screening})</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted ({summary.shortlisted})</TabsTrigger>
          <TabsTrigger value="offered">Offers ({summary.offered})</TabsTrigger>
          <TabsTrigger value="enrolled">Enrolled ({summary.enrolled})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({summary.rejected})</TabsTrigger>
        </TabsList>

        {["overview", "new", "screening", "shortlisted", "offered", "enrolled", "rejected"].map((t) => (
          <TabsContent key={t} value={t}>
            {t === "overview" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="glass p-5">
                  <h3 className="font-display text-base font-semibold mb-3">Stage Distribution</h3>
                  <div className="space-y-3">
                    {ADMISSION_STAGES.filter((s) => s.value !== "rejected").map((s) => (
                      <div key={s.value} className="flex items-center gap-3">
                        <Badge variant="secondary" className={`w-24 justify-center ${s.color}`}>{s.label}</Badge>
                        <Progress value={summary.total ? (summary[s.value] / summary.total) * 100 : 0} className="h-2 flex-1" />
                        <span className="w-10 text-right text-sm font-medium tabular-nums">{summary[s.value]}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="glass p-5">
                  <h3 className="font-display text-base font-semibold mb-3">Recent Applications</h3>
                  <div className="space-y-3">
                    {applicants.slice(0, 5).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">
                            {(a.first_name?.[0] ?? "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{a.display_name}</p>
                          <p className="text-xs text-muted-foreground">{a.admission_no} · {a.applied_grade ?? "N/A"}</p>
                        </div>
                        <Badge variant="secondary" className={stageColor(a.stage)}>{stageLabel(a.stage)}</Badge>
                      </div>
                    ))}
                    {applicants.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">No applications yet.</p>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="glass p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, admission no, email…"
                      className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9"
                    />
                  </div>
                  <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as AdmissionStage | "all")}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All stages" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All stages</SelectItem>
                      {ADMISSION_STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="w-full rounded-xl sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" /> Filters <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </div>

                {applicantsQuery.isLoading && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/30 py-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading applications…
                  </div>
                )}

                {!applicantsQuery.isLoading && filtered.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                    No applications match the current filters.
                  </div>
                )}

                {!applicantsQuery.isLoading && filtered.length > 0 && (
                  <div className="overflow-x-auto">
                    <TablePagination {...pag} />
                    <table className="w-full text-sm">
                      <thead className="">
                        <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="py-3 pl-2">Applicant</th>
                          <th className="py-3">Admission No</th>
                          <th className="py-3">Applied Program</th>
                          <th className="py-3">Contact</th>
                          <th className="py-3">Documents</th>
                          <th className="py-3">Stage</th>
                          <th className="py-3 pr-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pag.pageData.map((a, i) => (
                          <tr key={a.id} className="border-b border-border/40 transition-colors hover:bg-secondary/40 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                            <td className="py-3 pl-2">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">
                                    {(a.first_name?.[0] ?? "?").toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{a.display_name}</p>
                                  <p className="text-xs text-muted-foreground">{a.gender ?? "—"} · {a.dob ?? "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 font-mono text-xs text-muted-foreground">{a.admission_no}</td>
                            <td className="py-3">{a.applied_grade ?? "—"}</td>
                            <td className="py-3">
                              <div className="text-xs">
                                {a.email && <p>{a.email}</p>}
                                {a.phone && <p className="text-muted-foreground">{a.phone}</p>}
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge variant="secondary" className={
                                a.documents_status === "verified" ? "bg-success/15 text-success" :
                                a.documents_status === "submitted" ? "bg-primary/15 text-primary" :
                                a.documents_status === "partial" ? "bg-warning/15 text-warning" :
                                "bg-muted text-muted-foreground"
                              }>{a.documents_status}</Badge>
                            </td>
                            <td className="py-3">
                              <Badge variant="secondary" className={stageColor(a.stage)}>{stageLabel(a.stage)}</Badge>
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {getNextStages(a.stage).length > 0 && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost" size="sm"
                                        className="rounded-lg h-8 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                        onClick={() => { setActionTarget(a); setActionStage(getNextStages(a.stage)[0]); setActionNotes(""); }}
                                      >
                                        <Send className="h-3 w-3" /> Advance
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Advance Application</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Move {a.display_name} ({a.admission_no}) from{" "}
                                          <Badge variant="secondary" className={stageColor(a.stage)}>{stageLabel(a.stage)}</Badge>
                                          {" → "}
                                          <Select value={actionStage ?? getNextStages(a.stage)[0]} onValueChange={(v) => setActionStage(v as AdmissionStage)}>
                                            <SelectTrigger className="inline-flex w-auto h-7 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {getNextStages(a.stage).map((s) => (
                                                <SelectItem key={s} value={s}>{stageLabel(s)}</SelectItem>
                                              ))}
                                              <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <div className="px-6 pb-4">
                                        <Textarea
                                          value={actionNotes}
                                          onChange={(e) => setActionNotes(e.target.value)}
                                          placeholder="Add notes (optional)"
                                          rows={3}
                                          className="rounded-xl"
                                        />
                                      </div>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => {
                                            if (actionTarget && actionStage) {
                                              updateMutation.mutate({ id: actionTarget.id, stage: actionStage, notes: actionNotes || undefined });
                                            }
                                          }}
                                          className="bg-gradient-primary"
                                        >
                                          Confirm
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {a.stage === "offered" && (
                                  <Button variant="ghost" size="sm" className="rounded-lg h-8 text-xs gap-1 text-success hover:text-success hover:bg-success/10"
                                    onClick={() => initAdvance(a, "enrolled")}>
                                    <UserCheck className="h-3 w-3" /> Enroll
                                  </Button>
                                )}
                                {a.stage === "rejected" || a.stage === "enrolled" ? (
                                  <Button variant="ghost" size="sm" className="rounded-lg h-8 text-xs gap-1"
                                    onClick={() => toast.info(`Viewing ${a.display_name}'s details`)}>
                                    <Eye className="h-3 w-3" /> View
                                  </Button>
                                ) : null}
                                {canTransition(a.stage, "rejected") && a.stage !== "rejected" && (
                                  <Button variant="ghost" size="sm" className="rounded-lg h-8 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => initAdvance(a, "rejected")}>
                                    <XCircle className="h-3 w-3" /> Reject
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {updateMutation.isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <Card className="glass p-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Updating application…</span>
          </Card>
        </div>
      )}
    </div>
  );
}
