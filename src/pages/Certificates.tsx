import { useState, useRef, useEffect } from "react";
import { Award, Plus, Search, CheckCircle, XCircle, Ban, FileDown, QrCode, Loader2, Eye, Trash2, Copy, Download, ChevronDown, ChevronUp, ScrollText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generatePdfOnServer, generateSignedPdfOnServer } from "@/lib/certificates-client";
import { PageHeader } from "@/components/PageHeader";
import { StickyActionBar } from "@/components/StickyActionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getTemplates, saveTemplate, deleteTemplate,
  getRequests, createRequest, approveRequest, issueRequest, revokeRequest, deleteRequest,
  verifyByQr, lookupByCertificateNo,
  getStatusColor, getNextStatus,
  bulkGenerateRequests, bulkIssue,
  stageApprove, stageReject, getWorkflowHistory,
  WORKFLOW_STAGES, getStageLabel, getStageColor,
  type WorkflowStageId, type WorkflowAction,
  type CertTemplate, type CertRequest, type CertRequestJoined,
} from "@/lib/certificates";
import { fetchStudentRegister, type StudentRegisterRow } from "@/lib/student-records";
import { generateCertificateHtml, prepareCertificateData, printCertificate, CERTIFICATE_HTML_TEMPLATE } from "@/lib/certificate-styles";
import { generatePdfServerSide, streamPdfForDownload } from "@/lib/certificate-pdf-service";
import { migratePendingBridgeEntries } from "@/lib/certificates";
import { useAuth } from "@/hooks/useAuth";

const toastErr = (e: unknown) => toast.error((e as any)?.message ?? String(e));




export default function Certificates() {
  const qc = useQueryClient();
  const { roles } = useAuth();
  const [tab, setTab] = useState("templates");

  const { data: templates, isLoading: tl } = useQuery({ queryKey: ["cert-templates"], queryFn: getTemplates });
  const { data: requests, isLoading: rl } = useQuery({ queryKey: ["cert-requests"], queryFn: () => getRequests() });
  const { data: students } = useQuery({ queryKey: ["student-register"], queryFn: fetchStudentRegister });

  // On mount, consume any pending bridge entries from legacy generateCertificate redirect
  useEffect(() => {
    migratePendingBridgeEntries().then((result) => {
      if (result.migrated > 0) {
        qc.invalidateQueries({ queryKey: ["cert-requests"] });
        qc.invalidateQueries({ queryKey: ["cert-templates"] });
        toast.success(`Migrated ${result.migrated} certificate(s) from legacy system`);
      }
      if (result.errors.length > 0) {
        console.warn("Certificate migration errors:", result.errors);
      }
    }).catch((e) => console.error("Certificate migration failed:", e));
  }, []);

  // ── Template Dialog ──
  const [tplOpen, setTplOpen] = useState(false);
  const [editTpl, setEditTpl] = useState<CertTemplate | null>(null);
  const [tplCode, setTplCode] = useState("");
  const [tplName, setTplName] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [tplActive, setTplActive] = useState(true);

  const openTpl = (t?: CertTemplate) => {
    setEditTpl(t ?? null);
    setTplCode(t?.code ?? "");
    setTplName(t?.name ?? "");
    setTplBody(t?.body ?? "");
    setTplActive(t?.active ?? true);
    setTplOpen(true);
  };

  const saveTplMut = useMutation({
    mutationFn: () => saveTemplate(editTpl ? { ...editTpl, code: tplCode, name: tplName, body: tplBody, active: tplActive } : { code: tplCode, name: tplName, body: tplBody, active: tplActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-templates"] }); setTplOpen(false); toast.success(editTpl ? "Template updated" : "Template created"); },
    onError: (e) => toastErr(e),
  });

  const delTplMut = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-templates"] }); toast.success("Template deleted"); },
    onError: (e) => toastErr(e),
  });

  // ── Request Dialogs ──
  const [reqOpen, setReqOpen] = useState(false);
  const [reqTplId, setReqTplId] = useState("");
  const [reqStudentId, setReqStudentId] = useState("");
  const [reqPurpose, setReqPurpose] = useState("");

  const createReqMut = useMutation({
    mutationFn: () => createRequest({ template_id: reqTplId, student_id: reqStudentId, purpose: reqPurpose || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-requests"] }); setReqOpen(false); toast.success("Request created"); },
    onError: (e) => toastErr(e),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveRequest(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-requests"] }); toast.success("Request approved"); },
    onError: (e) => toastErr(e),
  });

  const issueMut = useMutation({
    mutationFn: (id: string) => issueRequest(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-requests"] }); toast.success("Certificate issued"); },
    onError: (e) => toastErr(e),
  });

  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeMode, setRevokeMode] = useState<"reject" | "revoke">("revoke");
  const revokeMut = useMutation({
    mutationFn: () => revokeRequest(revokeId!, revokeReason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-requests"] }); setRevokeId(null); setRevokeReason(""); toast.success("Certificate revoked"); },
    onError: (e) => toastErr(e),
  });

  const delReqMut = useMutation({
    mutationFn: (id: string) => deleteRequest(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-requests"] }); toast.success("Request deleted"); },
    onError: (e) => toastErr(e),
  });

  // Preview / Print
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReq, setPreviewReq] = useState<CertRequestJoined | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string | undefined>(undefined);
  const previewRef = useRef<HTMLDivElement | null>(null);

  function renderCertificateHtml(req: CertRequestJoined, qrDataUrl?: string) {
    const tpl = (req.template_body as string) ?? (req.template_html as string) ?? CERTIFICATE_HTML_TEMPLATE;
    const qrSrc = qrDataUrl ?? (req.qr_base64 ? `data:image/png;base64,${req.qr_base64}` : undefined);
    const data = prepareCertificateData({
      student_name: req.student_name,
      admission_no: req.admission_no,
      template_name: req.template_name ?? req.template ?? "",
      template_code: req.template_code ?? "",
      purpose: req.purpose ?? undefined,
      issued_at: req.issued_at ?? undefined,
      qr_token: req.qr_token ?? undefined,
      year: req.year ?? undefined,
      branch: req.branch ?? undefined,
      academic_year: req.academic_year ?? undefined,
      section: req.section ?? undefined,
      grade: req.grade ?? undefined,
      // include legacy uppercase fields for backward compatibility
      NAME: req.student_name ?? undefined,
      ROLL: req.admission_no ?? undefined,
      YEAR: req.year ?? undefined,
      BRANCH: req.branch ?? undefined,
      ACADEMIC_YEAR: req.academic_year ?? undefined,
      APPLICATION_DATE: req.issued_at ?? undefined,
      APPLICATION_PURPOSE: req.purpose ?? undefined,
      AUTHORITY: req.authority ?? undefined,
      NO: req.no ?? undefined,
      DATED: req.dated ?? req.issued_at ?? undefined,
      qr_token_short: (req.qr_token ?? "").slice(0, 16),
      qr_src: qrSrc,
      QR_SRC: qrSrc,
    } as Record<string, any>);

    return generateCertificateHtml(tpl, data as Record<string, string | boolean | undefined>);
  }

  const openPreview = async (r: CertRequestJoined) => {
    setPreviewReq(r);
    setPreviewOpen(true);
    // Generate QR data URL on the fly (qr_base64 is not stored in DB)
    if (r.qr_token) {
      try {
        const QRCode = await import("qrcode");
        const url = await QRCode.toDataURL(r.qr_token, { width: 120, margin: 1 });
        setPreviewQrDataUrl(url);
      } catch {
        setPreviewQrDataUrl(undefined);
      }
    } else {
      setPreviewQrDataUrl(undefined);
    }
  };

  const handlePrintPreview = () => {
    if (!previewReq) return;
    try {
      const html = renderCertificateHtml(previewReq, previewQrDataUrl);
      printCertificate(html, `Certificate - ${previewReq.student_name ?? previewReq.id}`);
    } catch (e: any) {
      toastErr(e);
    }
  };

  const handleDownloadPdf = async () => {
    if (!previewReq || !previewRef.current) return;
    try {
      // Prefer server-side PDF generation via Supabase Edge Function
      const request = {
        requestId: previewReq.id ?? String(Date.now()),
        studentId: previewReq.student_id ?? previewReq.admission_no ?? "unknown",
        studentName: previewReq.student_name ?? "",
        admissionNo: previewReq.admission_no ?? "",
        templateName: previewReq.template_name ?? previewReq.template ?? "",
        templateCode: previewReq.template_code ?? "",
        templateHtml: renderCertificateHtml(previewReq, previewQrDataUrl),
        purpose: previewReq.purpose ?? undefined,
        qrToken: previewReq.qr_token ?? "",
        issuedAt: previewReq.issued_at ?? undefined,
      };

      // Try server-side generation / streaming first
      try {
        const streamed = await streamPdfForDownload(request);
        if (streamed.success) return;
      } catch (e) {
        // ignore and fallback to client-side
      }

      // Client-side fallback
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const node = previewRef.current as HTMLElement;
      // Use moderated scale and JPEG export for smaller PDF size
      const canvas = await html2canvas(node, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' });
      // Export as JPEG with quality 0.85 to reduce size significantly compared to PNG
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      // Add JPEG image (smaller) to PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate-${request.requestId}.pdf`);
    } catch (e: any) {
      toast.error(e?.message ?? 'PDF generation failed');
    }
  };

  const handleDownloadHtml = () => {
    if (!previewReq) return;
    try {
      const html = renderCertificateHtml(previewReq, previewQrDataUrl);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${previewReq.id ?? 'export'}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message ?? 'HTML export failed');
    }
  };

  const handleSignedExport = async () => {
    if (!previewReq) return;
    try {
      const request = {
        requestId: previewReq.id ?? String(Date.now()),
        studentId: previewReq.student_id ?? previewReq.admission_no ?? "unknown",
        studentName: previewReq.student_name ?? "",
        admissionNo: previewReq.admission_no ?? "",
        templateName: previewReq.template_name ?? previewReq.template ?? "",
        templateCode: previewReq.template_code ?? "",
        templateHtml: renderCertificateHtml(previewReq, previewQrDataUrl),
        purpose: previewReq.purpose ?? undefined,
        qrToken: previewReq.qr_token ?? "",
        issuedAt: previewReq.issued_at ?? undefined,
      };

      const result = await generatePdfServerSide(request as any);
      if (result.success && result.pdfUrl) {
        const blobRes = await fetch(result.pdfUrl);
        const blob = await blobRes.blob();
        const name = `certificate-${request.requestId}.pdf`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Signed export complete');
        return;
      }

      toast.error(result.error ?? 'Signed export failed');
    } catch (e: any) {
      toastErr(e);
    }
  };

  // ── QR / CertNo Verify ──
  const [qrToken, setQrToken] = useState("");
  const [qrResult, setQrResult] = useState<CertRequestJoined | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [certNo, setCertNo] = useState("");
  const [certNoResult, setCertNoResult] = useState<CertRequestJoined | null>(null);
  const [certNoLoading, setCertNoLoading] = useState(false);

  const handleVerify = async () => {
    if (!qrToken.trim()) return;
    setQrLoading(true);
    try {
      const r = await verifyByQr(qrToken.trim());
      setQrResult(r);
      if (!r) toast.error("No certificate found with this token");
    } catch (e: any) {
      toast.error(e.message);
    }
    setQrLoading(false);
  };

  const handleLookupCertNo = async () => {
    if (!certNo.trim()) return;
    setCertNoLoading(true);
    try {
      const r = await lookupByCertificateNo(certNo.trim());
      setCertNoResult(r);
      if (!r) toast.error("No certificate found with this number");
    } catch (e: any) {
      toast.error((e as any)?.message ?? String(e));
    }
    setCertNoLoading(false);
  };

  // ── Bulk Generate ──
  const [bulkTplId, setBulkTplId] = useState("");
  const [bulkStudentIds, setBulkStudentIds] = useState<string[]>([]);
  const [bulkPurpose, setBulkPurpose] = useState("");

  const bulkMut = useMutation({
    mutationFn: () => bulkGenerateRequests(bulkTplId, bulkStudentIds, bulkPurpose || undefined),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["cert-requests"] }); toast.success(`${data.length} certificates generated`); setBulkStudentIds([]); },
    onError: (e) => toastErr(e),
  });

  const bulkIssueMut = useMutation({
    mutationFn: (ids: string[]) => bulkIssue(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-requests"] }); toast.success("Bulk issue complete"); },
    onError: (e) => toastErr(e),
  });

  // Search / filter state
  const [reqSearch, setReqSearch] = useState("");
  const [issuedSearch, setIssuedSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | WorkflowStageId>("all");

  // Timeline dialog
  const [tlReqId, setTlReqId] = useState<string | null>(null);
  const [tlActions, setTlActions] = useState<WorkflowAction[]>([]);
  const [tlLoading, setTlLoading] = useState(false);

  const openTimeline = async (id: string) => {
    setTlReqId(id);
    setTlLoading(true);
    try { setTlActions(await getWorkflowHistory(id)); }
    catch { setTlActions([]); }
    setTlLoading(false);
  };

  // Stage-appropriate mutations
  const stageApproveMut = useMutation({
    mutationFn: (id: string) => stageApprove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-requests"] }); toast.success("Stage approved — moved forward"); },
    onError: (e) => toastErr(e),
  });

  const stageRejectMut = useMutation({
    mutationFn: () => stageReject(revokeId!, revokeReason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-requests"] }); setRevokeId(null); setRevokeReason(""); toast.success("Request rejected at current stage"); },
    onError: (e) => toastErr(e),
  });

  // Derive user's role-matched stages
  const myStages = WORKFLOW_STAGES.filter((s) => s.roles.some((r) => roles.includes(r as any))).map((s) => s.id);

  const issued = (requests ?? []).filter((r) => r.status === "issued");
  const inReview = (requests ?? []).filter((r) => r.currentStage && r.status !== "issued" && r.status !== "revoked");
  const pending = (requests ?? []).filter((r) => r.status === "requested" || r.status === "approved");

  const filteredRequests = (requests ?? []).filter((r) =>
    (!reqSearch ||
      (r.student_name ?? "").toLowerCase().includes(reqSearch.toLowerCase()) ||
      (r.admission_no ?? "").toLowerCase().includes(reqSearch.toLowerCase()) ||
      (r.template_name ?? "").toLowerCase().includes(reqSearch.toLowerCase()) ||
      (r.purpose ?? "").toLowerCase().includes(reqSearch.toLowerCase())) &&
    (stageFilter === "all" || r.currentStage === stageFilter)
  );
  const filteredIssued = issued.filter((r) =>
    !issuedSearch ||
    (r.student_name ?? "").toLowerCase().includes(issuedSearch.toLowerCase()) ||
    (r.admission_no ?? "").toLowerCase().includes(issuedSearch.toLowerCase()) ||
    (r.template_name ?? "").toLowerCase().includes(issuedSearch.toLowerCase())
  );

  const pag1 = usePagination({ data: filteredRequests, pageSize: 10 });
  const pag2 = usePagination({ data: filteredIssued, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Certificates Engine" subtitle="Templates, requests, QR verification & bulk generation" icon={<Award className="h-6 w-6" />} />

      {/* Stats cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-normal">Templates</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{templates?.length ?? 0}</p></CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-normal">In Review</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{inReview.length}</p></CardContent>
        </Card>
        <Card className="border-info/20 bg-info/5">
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-normal">Issued</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{issued.length}</p></CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-normal">Revoked</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{(requests ?? []).filter((r) => r.status === "revoked").length}</p></CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 w-full flex-nowrap overflow-x-auto">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="requests">Requests <span className="ml-1.5 text-xs text-muted-foreground">({pending.length})</span></TabsTrigger>
          <TabsTrigger value="qr-verify">QR Verify</TabsTrigger>
          <TabsTrigger value="issued">Issuance Log <span className="ml-1.5 text-xs text-muted-foreground">({issued.length})</span></TabsTrigger>
          <TabsTrigger value="bulk">Bulk Generate</TabsTrigger>
        </TabsList>

        {/* ══════ TEMPLATES ══════ */}
        <TabsContent value="templates">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{templates?.length ?? 0} templates</p>
            <Button size="sm" className="w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto" onClick={() => openTpl()}>
              <Plus className="h-4 w-4 mr-1" /> New Template
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(templates ?? []).map((t) => (
              <Card key={t.id} className={`border ${t.active ? "border-border/50" : "border-dashed border-muted-foreground/30"}`}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold">{t.name}</CardTitle>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{t.code}</p>
                  </div>
                  <Badge variant={t.active ? "default" : "secondary"} className="shrink-0 text-[10px]">{t.active ? "Active" : "Inactive"}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/30 rounded p-2">{t.body}</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs" onClick={() => openTpl(t)}><Eye className="h-3 w-3 mr-1" /> Edit</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs text-destructive" onClick={() => { if (confirm("Delete template?")) delTplMut.mutate(t.id); }} disabled={delTplMut.isPending}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ══════ REQUESTS ══════ */}
        <TabsContent value="requests">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">{filteredRequests.length}/{requests?.length ?? 0} requests</p>
              <Input placeholder="Search student, template, purpose…" value={reqSearch} onChange={(e) => setReqSearch(e.target.value)} className="h-8 w-48 text-xs" />
            </div>
            <Button size="sm" className="w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto" onClick={() => { setReqTplId(""); setReqStudentId(""); setReqPurpose(""); setReqOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New Request
            </Button>
          </div>

          {/* Stage filter pills */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button onClick={() => setStageFilter("all")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${stageFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              All
            </button>
            {WORKFLOW_STAGES.map((s) => {
              const count = (requests ?? []).filter((r) => r.currentStage === s.id).length;
              const isMyStage = myStages.includes(s.id);
              return (
                <button key={s.id} onClick={() => setStageFilter(s.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${stageFilter === s.id ? "bg-primary text-primary-foreground" : isMyStage ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {s.label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                  {isMyStage && stageFilter !== s.id && <span className="ml-1 text-[10px] opacity-60">●</span>}
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <TablePagination {...pag1} />
            <Table className="min-w-max">
              <TableHeader className="">
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Template</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Stage</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(requests ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No requests yet</TableCell></TableRow>
                )}
                {pag1.pageData.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><span className="text-sm font-medium">{r.student_name ?? "—"}</span><br /><span className="text-[10px] text-muted-foreground">{r.admission_no ?? ""}</span></TableCell>
                    <TableCell><span className="text-xs">{r.template_name ?? "—"}</span><br /><span className="text-[10px] text-muted-foreground">{r.template_code ?? ""}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.purpose ?? "—"}</TableCell>
                    <TableCell>
                      {r.currentStage ? (
                        <Badge className={`border text-[10px] ${getStageColor(r.currentStage)}`}>{getStageLabel(r.currentStage)}</Badge>
                      ) : (
                        <Badge className={`border text-[10px] ${getStatusColor(r.status)}`}>{r.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge className={`border text-[10px] ${getStatusColor(r.status)}`}>{r.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {/* Stage-appropriate actions */}
                        {r.currentStage === "hod_review" && r.status !== "revoked" && (
                          <>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => stageApproveMut.mutate(r.id)} disabled={stageApproveMut.isPending}><CheckCircle className="h-3 w-3 mr-1" /> HOD Approve</Button>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { setRevokeId(r.id); setRevokeReason(""); setRevokeMode("reject"); }}><Ban className="h-3 w-3 mr-1" /> Reject</Button>
                          </>
                        )}
                        {r.currentStage === "office_review" && r.status !== "revoked" && (
                          <>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => stageApproveMut.mutate(r.id)} disabled={stageApproveMut.isPending}><CheckCircle className="h-3 w-3 mr-1" /> Verify (Office)</Button>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { setRevokeId(r.id); setRevokeReason(""); setRevokeMode("reject"); }}><Ban className="h-3 w-3 mr-1" /> Reject</Button>
                          </>
                        )}
                        {r.currentStage === "principal_review" && r.status !== "revoked" && (
                          <>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => stageApproveMut.mutate(r.id)} disabled={stageApproveMut.isPending}><CheckCircle className="h-3 w-3 mr-1" /> Principal Approve</Button>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { setRevokeId(r.id); setRevokeReason(""); setRevokeMode("reject"); }}><Ban className="h-3 w-3 mr-1" /> Reject</Button>
                          </>
                        )}
                        {r.currentStage === "issuance" && r.status !== "revoked" && (
                          <>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => stageApproveMut.mutate(r.id)} disabled={stageApproveMut.isPending}><FileDown className="h-3 w-3 mr-1" /> Issue</Button>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { setRevokeId(r.id); setRevokeReason(""); setRevokeMode("revoke"); }}><Ban className="h-3 w-3 mr-1" /> Revoke</Button>
                          </>
                        )}
                        {r.currentStage === "delivery" && r.status === "issued" && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => stageApproveMut.mutate(r.id)} disabled={stageApproveMut.isPending}><CheckCircle className="h-3 w-3 mr-1" /> Mark Delivered</Button>
                        )}
                        {/* Fallback for items without stage info (backward compat) */}
                        {!r.currentStage && r.status === "requested" && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => approveMut.mutate(r.id)} disabled={approveMut.isPending}><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                        )}
                        {!r.currentStage && r.status === "approved" && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => issueMut.mutate(r.id)} disabled={issueMut.isPending}><FileDown className="h-3 w-3 mr-1" /> Issue</Button>
                        )}
                        {(r.status === "revoked") && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => { if (confirm("Delete this request?")) delReqMut.mutate(r.id); }} disabled={delReqMut.isPending}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
                        )}
                        {/* Timeline button */}
                        <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => openTimeline(r.id)}><ScrollText className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ══════ QR / CERTNO VERIFY ══════ */}
        <TabsContent value="qr-verify">
          <div className="mx-auto max-w-lg space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Verify by QR Token</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="Enter QR token" value={qrToken} onChange={(e) => setQrToken(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleVerify()} />
                  <Button onClick={handleVerify} disabled={qrLoading} className="w-full rounded-xl sm:w-auto sm:shrink-0">
                    {qrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Verify
                  </Button>
                </div>
                {qrResult && (
                  <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-2">
                    <div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-success" /><Badge className={`border ${getStatusColor(qrResult.status)}`}>{qrResult.status}</Badge></div>
                    <Separator />
                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <span className="text-muted-foreground">Student</span><span className="font-medium">{qrResult.student_name}</span>
                      <span className="text-muted-foreground">Admission No</span><span>{qrResult.admission_no}</span>
                      <span className="text-muted-foreground">Template</span><span>{qrResult.template_name} ({qrResult.template_code})</span>
                      <span className="text-muted-foreground">Purpose</span><span>{qrResult.purpose ?? "—"}</span>
                      <span className="text-muted-foreground">Issued</span><span>{qrResult.issued_at ? new Date(qrResult.issued_at).toLocaleDateString() : "—"}</span>
                    </div>
                    <Separator />
                    <p className="text-[10px] font-mono text-muted-foreground break-all">Token: {qrResult.qr_token}</p>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs" onClick={() => { navigator.clipboard.writeText(qrResult.qr_token!); toast.success("Token copied"); }}><Copy className="h-3 w-3 mr-1" /> Copy Token</Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Verify by Certificate Number</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="Enter certificate number" value={certNo} onChange={(e) => setCertNo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLookupCertNo()} />
                  <Button onClick={handleLookupCertNo} disabled={certNoLoading} className="w-full rounded-xl sm:w-auto sm:shrink-0">
                    {certNoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Lookup
                  </Button>
                </div>
                {certNoResult && (
                  <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-2">
                    <div className="flex items-center gap-2"><FileDown className="h-4 w-4 text-success" /><Badge className={`border ${getStatusColor(certNoResult.status)}`}>{certNoResult.status}</Badge></div>
                    <Separator />
                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <span className="text-muted-foreground">Student</span><span className="font-medium">{certNoResult.student_name}</span>
                      <span className="text-muted-foreground">Admission No</span><span>{certNoResult.admission_no}</span>
                      <span className="text-muted-foreground">Certificate No</span><span>{certNoResult.no ?? "—"}</span>
                      <span className="text-muted-foreground">Template</span><span>{certNoResult.template_name} ({certNoResult.template_code})</span>
                      <span className="text-muted-foreground">Purpose</span><span>{certNoResult.purpose ?? "—"}</span>
                      <span className="text-muted-foreground">Issued</span><span>{certNoResult.issued_at ? new Date(certNoResult.issued_at).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════ ISSUANCE LOG ══════ */}
        <TabsContent value="issued">
          <div className="mb-3">
            <Input placeholder="Search by student, admission no, template…" value={issuedSearch} onChange={(e) => setIssuedSearch(e.target.value)} className="h-8 w-64 text-xs" />
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <TablePagination {...pag2} />
            <Table className="min-w-max">
              <TableHeader className="">
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Template</TableHead>
                  <TableHead className="text-xs">Issued</TableHead>
                  <TableHead className="text-xs">QR Token</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issued.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No certificates issued yet</TableCell></TableRow>
                )}
                {pag2.pageData.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><span className="text-sm font-medium">{r.student_name ?? "—"}</span><br /><span className="text-[10px] text-muted-foreground">{r.admission_no ?? ""}</span></TableCell>
                    <TableCell className="text-xs">{r.template_name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.issued_at ? new Date(r.issued_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><code className="text-[10px] font-mono text-muted-foreground">{(r.qr_token ?? "").slice(0, 16)}…</code></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => { navigator.clipboard.writeText(r.qr_token); toast.success("Token copied"); }}><Copy className="h-3 w-3 mr-1" /> Token</Button>
                        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => openPreview(r)}><Download className="h-3 w-3 mr-1" /> Preview</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ══════ BULK GENERATE ══════ */}
        <TabsContent value="bulk">
          <Card className="max-w-xl">
            <CardHeader><CardTitle className="text-sm">Bulk Generate Certificates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs" htmlFor="bulkTemplate">Template</Label>
                <Select name="bulkTemplate" value={bulkTplId} onValueChange={setBulkTplId}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>
                    {(templates ?? []).filter((t) => t.active).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="bulkPurpose">Purpose (optional)</Label>
                <Input id="bulkPurpose" name="bulkPurpose" value={bulkPurpose} onChange={(e) => setBulkPurpose(e.target.value)} placeholder="e.g. Transfer certificate" />
              </div>
              <div>
                <Label className="text-xs">Select Students ({bulkStudentIds.length} selected)</Label>
                <ScrollArea className="h-48 rounded-lg border mt-1">
                  <div className="p-2 space-y-1">
                    {(students ?? []).map((s) => (
                      <label key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer">
                        <input type="checkbox" name="studentSelect" checked={bulkStudentIds.includes(s.id)} onChange={() => setBulkStudentIds((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id])} className="rounded" />
                        <span className="font-medium">{s.display_name}</span>
                        <span className="text-[10px] text-muted-foreground">{s.admission_no}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <StickyActionBar className="justify-end">
                <Button className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => bulkMut.mutate()} disabled={!bulkTplId || bulkStudentIds.length === 0 || bulkMut.isPending}>
                  {bulkMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Generate {bulkStudentIds.length} Certificate{bulkStudentIds.length !== 1 ? "s" : ""}
                </Button>
                {pending.length > 0 && (
                  <Button variant="outline" className="rounded-xl" onClick={() => { if (confirm(`Issue ${pending.length} pending certificates?`)) bulkIssueMut.mutate(pending.map((r) => r.id)); }} disabled={bulkIssueMut.isPending}>
                    {bulkIssueMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Bulk Issue All ({pending.length} pending)
                  </Button>
                )}
              </StickyActionBar>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════ TEMPLATE DIALOG ══════ */}
      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="sm:max-w-md p-4">
          <DialogHeader><DialogTitle>{editTpl ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs" htmlFor="tplCode">Code</Label>
                <Input id="tplCode" name="tplCode" value={tplCode} onChange={(e) => setTplCode(e.target.value)} placeholder="e.g. BONAFIDE" />
              </div>
              <div>
                <Label className="text-xs" htmlFor="tplName">Name</Label>
                <Input id="tplName" name="tplName" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Bonafide Certificate" />
              </div>
            </div>
            <div>
              <Label className="text-xs" htmlFor="tplBody">Body (HTML template)</Label>
              <Textarea id="tplBody" name="tplBody" value={tplBody} onChange={(e) => setTplBody(e.target.value)} rows={8} placeholder="<p>This is to certify that {{student_name}}...</p>" className="font-mono text-xs" />
            </div>
            <details className="group border rounded-lg p-2">
              <summary className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                Available Variables
              </summary>
              <div className="mt-2 text-[11px] space-y-1">
                {[
                  ['{{student_name}}', 'Student name'],
                  ['{{admission_no}}', 'Admission/roll number'],
                  ['{{purpose}}', 'Certificate purpose'],
                  ['{{issued_at}}', 'Issue date'],
                  ['{{qr_token}}', 'QR verification token'],
                  ['{{template_name}}', 'Template name'],
                  ['{{template_code}}', 'Template code'],
                  ['{{certificate_no}}', 'Certificate number (auto)'],
                ].map(([varName, desc]) => (
                  <div key={varName} className="flex items-center gap-2">
                    <code className="bg-muted/40 rounded px-1 py-0.5 font-mono">{varName}</code>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </details>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="tplActive" checked={tplActive} onChange={(e) => setTplActive(e.target.checked)} className="rounded" />
              <Label htmlFor="tplActive" className="text-xs">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTplOpen(false)}>Cancel</Button>
            <Button onClick={() => saveTplMut.mutate()} disabled={!tplCode || !tplName || !tplBody || saveTplMut.isPending}>
              {saveTplMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editTpl ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ PREVIEW DIALOG ══════ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-4 pb-0"><DialogTitle>Certificate Preview</DialogTitle></DialogHeader>
          <Tabs defaultValue="preview" className="px-6">
            <TabsList className="mb-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="data">Certificate Data</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <div className="p-4 border rounded-lg" ref={previewRef} style={{ background: '#fff' }}>
                <div className="certificate" dangerouslySetInnerHTML={{ __html: previewReq ? renderCertificateHtml(previewReq, previewQrDataUrl) : '' }} />
              </div>
            </TabsContent>
            <TabsContent value="data">
              {previewReq && (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="font-medium text-muted-foreground">Student Name</div><div>{previewReq.student_name ?? "—"}</div>
                    <div className="font-medium text-muted-foreground">Admission / Roll No</div><div>{previewReq.admission_no ?? "—"}</div>
                    <div className="font-medium text-muted-foreground">Year of Study</div><div>{previewReq.year ?? "—"}</div>
                    <div className="font-medium text-muted-foreground">Branch / Course</div><div>{previewReq.branch ?? "—"}</div>
                    <div className="font-medium text-muted-foreground">Academic Year</div><div>{previewReq.academic_year ?? "—"}</div>
                    <div className="font-medium text-muted-foreground">Template</div><div>{previewReq.template_name ?? "—"} ({previewReq.template_code ?? "—"})</div>
                    <div className="font-medium text-muted-foreground">Purpose</div><div>{previewReq.purpose ?? "—"}</div>
                    <div className="font-medium text-muted-foreground">Status</div><div><Badge className={`border text-[10px] ${getStatusColor(previewReq.status)}`}>{previewReq.status}</Badge></div>
                    <div className="font-medium text-muted-foreground">Certificate No</div><div>{previewReq.no ?? "—"}</div>
                    <div className="font-medium text-muted-foreground">Dated</div><div>{previewReq.dated ?? "—"}</div>
                    <div className="font-medium text-muted-foreground">Applied On</div><div>{previewReq.created_at ? new Date(previewReq.created_at).toLocaleDateString() : "—"}</div>
                    <div className="font-medium text-muted-foreground">Approved On</div><div>{previewReq.approved_at ? new Date(previewReq.approved_at).toLocaleDateString() : "—"}</div>
                    <div className="font-medium text-muted-foreground">Issued On</div><div>{previewReq.issued_at ? new Date(previewReq.issued_at).toLocaleDateString() : "—"}</div>
                    <div className="font-medium text-muted-foreground">Authority</div><div>{previewReq.authority ?? "—"}</div>
                    <div className="font-medium text-muted-foreground">QR Token</div><div><code className="text-[10px] break-all">{previewReq.qr_token}</code></div>
                  </div>
                  <details className="border rounded-lg p-3 mt-4">
                    <summary className="text-xs font-medium text-muted-foreground cursor-pointer select-none">Show all template variables</summary>
                    <pre className="mt-2 text-[10px] font-mono bg-muted/30 rounded p-2 overflow-x-auto whitespace-pre-wrap">{[
                      ["student_name", previewReq.student_name],
                      ["admission_no", previewReq.admission_no],
                      ["year", previewReq.year],
                      ["branch", previewReq.branch],
                      ["academic_year", previewReq.academic_year],
                      ["purpose", previewReq.purpose],
                      ["template_name", previewReq.template_name],
                      ["template_code", previewReq.template_code],
                      ["issued_at", previewReq.issued_at],
                      ["qr_token", previewReq.qr_token],
                      ["authority", previewReq.authority],
                      ["no", previewReq.no],
                      ["dated", previewReq.dated],
                      ["NAME", previewReq.student_name],
                      ["ROLL", previewReq.admission_no],
                      ["YEAR", previewReq.year],
                      ["BRANCH", previewReq.branch],
                      ["ACADEMIC_YEAR", previewReq.academic_year],
                      ["APPLICATION_DATE", previewReq.issued_at],
                      ["APPLICATION_PURPOSE", previewReq.purpose],
                      ["AUTHORITY", previewReq.authority],
                      ["NO", previewReq.no],
                      ["DATED", previewReq.dated],
                    ].filter(([_, v]) => v != null).map(([k, v]) => `  {{${k}}}: ${v}`).join("\n")}</pre>
                  </details>
                </div>
              )}
            </TabsContent>
            <TabsContent value="template">
              {previewReq && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Raw template HTML with variable placeholders:</p>
                  <pre className="text-[10px] font-mono bg-muted/30 rounded p-3 max-h-80 overflow-auto whitespace-pre-wrap border">{previewReq.template_body ?? previewReq.template_html ?? previewReq.template ?? "No template body"}</pre>
                  <details className="border rounded-lg p-3">
                    <summary className="text-xs font-medium text-muted-foreground cursor-pointer select-none">Available variables</summary>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
                      {["student_name", "admission_no", "year", "branch", "academic_year", "purpose", "template_name", "template_code", "issued_at", "qr_token", "certificate_no", "authority", "no", "dated", "application_date", "application_purpose", "NAME", "ROLL", "YEAR", "BRANCH", "ACADEMIC_YEAR", "APPLICATION_DATE", "APPLICATION_PURPOSE", "AUTHORITY", "NO", "DATED", "QR_SRC"].map((v) => <div key={v}><code className="bg-muted/40 rounded px-1">{`{{${v}}}`}</code></div>)}
                    </div>
                  </details>
                </div>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter className="px-6 pb-4 pt-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handlePrintPreview}>Print</Button>
              <Button variant="outline" size="sm" onClick={handleDownloadHtml}>HTML</Button>
              <Button size="sm" onClick={handleDownloadPdf}>Download PDF</Button>
              {import.meta.env.VITE_CERT_SERVER_URL && (
                <Button variant="secondary" size="sm" onClick={handleSignedExport}>Signed Export</Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ REQUEST DIALOG ══════ */}
      <Dialog open={reqOpen} onOpenChange={setReqOpen}>
          <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Certificate Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs" htmlFor="reqTemplate">Template</Label>
              <Select name="reqTemplate" value={reqTplId} onValueChange={setReqTplId}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {(templates ?? []).filter((t) => t.active).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs" htmlFor="reqStudent">Student</Label>
              <Select name="reqStudent" value={reqStudentId} onValueChange={setReqStudentId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {(students ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.display_name} ({s.admission_no})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs" htmlFor="reqPurpose">Purpose (optional)</Label>
              <Input id="reqPurpose" name="reqPurpose" value={reqPurpose} onChange={(e) => setReqPurpose(e.target.value)} placeholder="e.g. GCT application" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqOpen(false)}>Cancel</Button>
            <Button onClick={() => createReqMut.mutate()} disabled={!reqTplId || !reqStudentId || createReqMut.isPending}>
              {createReqMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ REVOKE / REJECT DIALOG ══════ */}
      <Dialog open={!!revokeId} onOpenChange={(o) => { if (!o) setRevokeId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{revokeMode === "reject" ? "Reject at Current Stage" : "Revoke Certificate"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{revokeMode === "reject" ? "This will reject the request at its current workflow stage." : "This action cannot be undone."}</p>
            <div>
              <Label className="text-xs" htmlFor="revokeReason">Reason</Label>
              <Textarea id="revokeReason" name="revokeReason" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={3} placeholder={revokeMode === "reject" ? "e.g. Incomplete documents" : "e.g. Issued in error"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => revokeMode === "reject" ? stageRejectMut.mutate() : revokeMut.mutate()} disabled={!revokeReason || revokeMut.isPending || stageRejectMut.isPending}>
              {(revokeMut.isPending || stageRejectMut.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {revokeMode === "reject" ? "Reject" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ WORKFLOW TIMELINE DIALOG ══════ */}
      <Dialog open={!!tlReqId} onOpenChange={(o) => { if (!o) setTlReqId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Workflow Timeline</DialogTitle></DialogHeader>
          {tlLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : tlActions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No workflow history yet</p>
          ) : (
            <div className="space-y-0">
              {tlActions.map((a, i) => (
                <div key={i} className="flex gap-3 pb-4 relative">
                  {i < tlActions.length - 1 && <div className="absolute left-[11px] top-5 bottom-0 w-px bg-border" />}
                  <div className={`mt-1 h-5 w-5 rounded-full shrink-0 flex items-center justify-center ring-2 ring-background ${a.action === "reject" ? "bg-destructive/20" : "bg-success/20"}`}>
                    <div className={`h-2 w-2 rounded-full ${a.action === "reject" ? "bg-destructive" : "bg-success"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium capitalize">{a.action}</span>
                      <Badge className={`border text-[9px] ${getStageColor(a.stage)}`}>{getStageLabel(a.stage)}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(a.at).toLocaleString()}</p>
                    {a.reason && <p className="text-[10px] text-destructive mt-0.5">Reason: {a.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTlReqId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
