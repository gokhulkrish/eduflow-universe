import { useEffect, useState } from "react";
import { Briefcase, Plus, Users, Trash2, Building2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { subscribeAppSync } from "@/lib/app-sync";
import { useRealtime } from "@/lib/use-realtime";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { companiesKey, jobsKey, placementRegistrationsKey, interviewStagesKey, getJobs, createJob, updateJob, deleteJob, getRegistrations, registerStudent, updateRegistration, getCompanies, createCompany, deleteCompany, getInterviews, addInterviewStage, updateInterviewStage, getPlacementAnalytics } from "@/lib/placement";
import type { JobPosting, Company, PlacementRegistration, InterviewStage } from "@/lib/placement";

export default function PlacementCell() {
  const [tab, setTab] = useState("analytics");
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [regs, setRegs] = useState<PlacementRegistration[]>([]);
  const [interviews, setInterviews] = useState<InterviewStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({ openJobs: 0, totalVacancies: 0, totalRegistrations: 0, placed: 0, totalJobs: 0, companies: 0, avgSalary: 0 });

  const refreshJobs = async () => { setJobs(await getJobs()); };
  const refreshCompanies = async () => { setCompanies(await getCompanies()); };
  const refreshRegs = async () => { setRegs(await getRegistrations()); };
  const refreshInterviews = async () => { setInterviews(await getInterviews()); };
  const refreshAll = () => { refreshJobs(); refreshCompanies(); refreshRegs(); refreshInterviews(); };

  const pag1 = usePagination({ data: companies, pageSize: 10 });
  const pag2 = usePagination({ data: regs, pageSize: 10 });

  useEffect(() => {
    Promise.all([refreshJobs(), refreshCompanies(), refreshRegs(), refreshInterviews()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => subscribeAppSync([companiesKey, jobsKey, placementRegistrationsKey, interviewStagesKey], () => {
    refreshJobs();
    refreshCompanies();
    refreshRegs();
    refreshInterviews();
  }), []);
  useRealtime("placement_companies", refreshAll);
  useRealtime("placement_registrations", refreshAll);
  useRealtime("interview_stages", refreshAll);

  useEffect(() => { getPlacementAnalytics().then(setAnalytics); }, [jobs, companies, regs]);

  const [jOpen, setJOpen] = useState(false); const [jEditId, setJEditId] = useState<string | null>(null);
  const [jTitle, setJTitle] = useState(""); const [jCompany, setJCompany] = useState(""); const [jCompanyId, setJCompanyId] = useState(""); const [jLoc, setJLoc] = useState(""); const [jDesc, setJDesc] = useState(""); const [jReq, setJReq] = useState(""); const [jSalary, setJSalary] = useState(""); const [jVacancy, setJVacancy] = useState("1"); const [jDeadline, setJDeadline] = useState("");
  const [cOpen, setCOpen] = useState(false); const [cName, setCName] = useState(""); const [cIndustry, setCIndustry] = useState(""); const [cWebsite, setCWebsite] = useState(""); const [cContacts, setCContacts] = useState("");
  const [regOpen, setRegOpen] = useState(false); const [regJobId, setRegJobId] = useState(""); const [studentName, setStudentName] = useState("");
  const [ivOpen, setIvOpen] = useState(false); const [ivRegId, setIvRegId] = useState(""); const [ivStage, setIvStage] = useState("screening"); const [ivFeedback, setIvFeedback] = useState(""); const [ivStatus, setIvStatus] = useState("passed");
  const STAGES = ["screening", "written", "technical", "hr", "offer"];

  const openJobEdit = (j?: any) => {
    setJEditId(j?.id ?? null); setJTitle(j?.title ?? ""); setJCompany(j?.company ?? ""); setJCompanyId(j?.company_id ?? ""); setJLoc(j?.location ?? ""); setJDesc(j?.description ?? ""); setJReq(j?.requirements ?? ""); setJSalary(j?.salary ?? ""); setJVacancy(String(j?.vacancy ?? 1)); setJDeadline(j?.deadline?.split("T")[0] ?? ""); setJOpen(true);
  };
  const handleJobSave = async () => {
    const data = { title: jTitle, company: jCompany, company_id: jCompanyId, location: jLoc, description: jDesc, requirements: jReq, salary: jSalary, vacancy: Number(jVacancy), deadline: jDeadline ? new Date(jDeadline).toISOString() : null, status: jEditId ? (jobs.find((j) => j.id === jEditId)?.status ?? "draft") : "draft" };
    if (jEditId) { await updateJob(jEditId, data); } else { await createJob(data as any); }
    await refreshJobs(); setJOpen(false); toast.success(jEditId ? "Updated" : "Created");
  };
  const handleStatus = async (id: string, s: string) => { await updateJob(id, { status: s }); await refreshJobs(); toast.success(`Status: ${s}`); };

  return (
    <div>
      <PageHeader title="Placement Cell" subtitle="Job postings, recruiters, interviews & analytics" icon={<Briefcase className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="companies">Recruiters</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {loading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div> : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Open Jobs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{analytics.openJobs}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Vacancies</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{analytics.totalVacancies}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Registrations</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{analytics.totalRegistrations}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Placed</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-success">{analytics.placed}</p></CardContent></Card>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Jobs</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{analytics.totalJobs}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Recruiters</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{analytics.companies}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Avg Salary</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{analytics.avgSalary ? `₹${Math.round(analytics.avgSalary / 1000)}K` : "—"}</p></CardContent></Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="jobs">
          {loading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div> : (
            <>
              <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => openJobEdit()}><Plus className="h-4 w-4 mr-1" /> Post Job</Button></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No jobs posted</CardContent></Card>}
                {jobs.map((j) => (
                  <Card key={j.id} className="border-border/40">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between"><CardTitle className="text-sm">{j.title}</CardTitle><Badge className={`text-[9px] ${j.status === "open" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{j.status}</Badge></div>
                      <p className="text-xs text-muted-foreground">{j.company} · {j.location} · {j.vacancy || 1} vacancy</p>
                    </CardHeader>
                    <CardContent className="space-y-1 text-xs">
                      <p className="text-muted-foreground line-clamp-2">{j.description}</p>
                      <p className="text-muted-foreground"><strong>Req:</strong> {j.requirements}</p>
                      <p className="text-muted-foreground">{j.salary ? `${j.salary} · ` : ""}Deadline: {j.deadline ? new Date(j.deadline).toLocaleDateString() : "—"}</p>
                      <div className="flex gap-2 pt-2 flex-wrap">
                        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => openJobEdit(j)}>Edit</Button>
                        {j.status === "draft" && <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => handleStatus(j.id, "open")}>Open</Button>}
                        {j.status === "open" && <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => handleStatus(j.id, "closed")}>Close</Button>}
                        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => { setRegJobId(j.id); setStudentName(""); setRegOpen(true); }}><Users className="h-3 w-3 mr-1" />Register</Button>
                        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={async () => { await deleteJob(j.id); await refreshJobs(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="companies">
          {loading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div> : (
            <>
              <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setCName(""); setCIndustry(""); setCWebsite(""); setCContacts(""); setCOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Recruiter</Button></div>
              <TablePagination {...pag1} />
              <Table>
                <TableHeader className=""><TableRow><TableHead className="text-xs">Company</TableHead><TableHead className="text-xs">Industry</TableHead><TableHead className="text-xs">Website</TableHead><TableHead className="text-xs">Past Drives</TableHead><TableHead className="text-xs">Offers Made</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {companies.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No recruiters added</TableCell></TableRow>}
                  {pag1.pageData.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs font-medium">{c.name}</TableCell>
                      <TableCell className="text-xs">{c.industry}</TableCell>
                      <TableCell className="text-xs text-primary underline"><a href={c.website} target="_blank">{c.website}</a></TableCell>
                      <TableCell className="text-xs">{c.past_drives}</TableCell>
                      <TableCell className="text-xs">{c.offers_made}</TableCell>
                      <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={async () => { await deleteCompany(c.id); await refreshCompanies(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </TabsContent>

        <TabsContent value="pipeline">
          {loading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div> : (
            <>
              <TablePagination {...pag2} />
              <Table>
                <TableHeader className=""><TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Job</TableHead><TableHead className="text-xs">Registered</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Interviews</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {regs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No registrations</TableCell></TableRow>}
                  {pag2.pageData.map((r) => {
                    const ivs = interviews.filter((iv) => iv.reg_id === r.id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{r.student}</TableCell>
                        <TableCell className="text-xs">{(jobs.find((j) => j.id === r.job_id)?.title ?? "—")}</TableCell>
                        <TableCell className="text-xs">{new Date(r.registered_at).toLocaleDateString()}</TableCell>
                        <TableCell><Badge className={`text-[9px] ${r.status === "placed" ? "bg-success/15 text-success" : r.status === "shortlisted" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>{r.status}</Badge></TableCell>
                        <TableCell className="text-xs">{ivs.length > 0 ? ivs.map((iv) => iv.stage).join(", ") : "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {r.status === "registered" && <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={async () => { await updateRegistration(r.id, "shortlisted"); await refreshRegs(); toast.success("Shortlisted"); }}>Shortlist</Button>}
                            {r.status === "shortlisted" && <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={async () => { await updateRegistration(r.id, "placed"); await refreshRegs(); toast.success("Placed"); }}>Place</Button>}
                            <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { setIvRegId(r.id); setIvStage("screening"); setIvFeedback(""); setIvStatus("passed"); setIvOpen(true); }}>+ Stage</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={jOpen} onOpenChange={setJOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{jEditId ? "Edit" : "New"} Job</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" htmlFor="jobTitle">Title</Label><Input id="jobTitle" name="jobTitle" value={jTitle} onChange={(e) => setJTitle(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="jobCompany">Company Name</Label><Input id="jobCompany" name="jobCompany" value={jCompany} onChange={(e) => setJCompany(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" htmlFor="jobLocation">Location</Label><Input id="jobLocation" name="jobLocation" value={jLoc} onChange={(e) => setJLoc(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="jobVacancy">Vacancy</Label><Input id="jobVacancy" name="jobVacancy" type="number" value={jVacancy} onChange={(e) => setJVacancy(e.target.value)} /></div>
            </div>
            <div><Label className="text-xs" htmlFor="jobDesc">Description</Label><Textarea id="jobDesc" name="jobDesc" value={jDesc} onChange={(e) => setJDesc(e.target.value)} rows={2} /></div>
            <div><Label className="text-xs" htmlFor="jobReq">Requirements</Label><Textarea id="jobReq" name="jobReq" value={jReq} onChange={(e) => setJReq(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="jobSalary">Salary</Label><Input id="jobSalary" name="jobSalary" value={jSalary} onChange={(e) => setJSalary(e.target.value)} placeholder="e.g. ₹5LPA" /></div><div><Label className="text-xs" htmlFor="jobDeadline">Deadline</Label><Input id="jobDeadline" name="jobDeadline" type="date" value={jDeadline} onChange={(e) => setJDeadline(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setJOpen(false)}>Cancel</Button><Button onClick={handleJobSave} disabled={!jTitle || !jCompany}>{jEditId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cOpen} onOpenChange={setCOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Recruiter</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="companyName">Company Name</Label><Input id="companyName" name="companyName" value={cName} onChange={(e) => setCName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="companyIndustry">Industry</Label><Input id="companyIndustry" name="companyIndustry" value={cIndustry} onChange={(e) => setCIndustry(e.target.value)} /></div><div><Label className="text-xs" htmlFor="companyWebsite">Website</Label><Input id="companyWebsite" name="companyWebsite" value={cWebsite} onChange={(e) => setCWebsite(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="companyContacts">Contacts (comma separated)</Label><Input id="companyContacts" name="companyContacts" value={cContacts} onChange={(e) => setCContacts(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCOpen(false)}>Cancel</Button><Button disabled={!cName} onClick={async () => { await createCompany({ name: cName, industry: cIndustry, website: cWebsite, contacts: cContacts, past_drives: 0, offers_made: 0 }); await refreshCompanies(); setCOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regOpen} onOpenChange={setRegOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Register Student</DialogTitle></DialogHeader>
          <div><Label className="text-xs" htmlFor="studentName">Student Name</Label><Input id="studentName" name="studentName" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Full name" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setRegOpen(false)}>Cancel</Button><Button disabled={!studentName} onClick={async () => { await registerStudent(regJobId, studentName); await refreshRegs(); setRegOpen(false); toast.success("Registered"); }}>Register</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ivOpen} onOpenChange={setIvOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Interview Stage</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="ivStage">Stage</Label><Select name="ivStage" value={ivStage} onValueChange={setIvStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs" htmlFor="ivStatus">Status</Label><Select name="ivStatus" value={ivStatus} onValueChange={setIvStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="passed">Passed</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs" htmlFor="ivFeedback">Feedback</Label><Textarea id="ivFeedback" name="ivFeedback" value={ivFeedback} onChange={(e) => setIvFeedback(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIvOpen(false)}>Cancel</Button><Button onClick={async () => { const iv = await addInterviewStage(ivRegId, ivStage); await updateInterviewStage(iv.id, { status: ivStatus, feedback: ivFeedback, conducted_at: new Date().toISOString() }); await refreshInterviews(); setIvOpen(false); toast.success("Stage added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
