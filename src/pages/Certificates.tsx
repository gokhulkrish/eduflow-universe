import { useState, useRef } from "react";
import { Award, Plus, Search, CheckCircle, XCircle, Ban, FileDown, QrCode, Loader2, Eye, Trash2, Copy, Download } from "lucide-react";
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
  verifyByQr, bulkGenerateRequests, bulkIssue,
  getStatusColor, getNextStatus,
  type CertTemplate, type CertRequest, type CertRequestJoined,
} from "@/lib/certificates";
import { fetchStudentRegister, type StudentRegisterRow } from "@/lib/student-records";
import { generateCertificateHtml, prepareCertificateData, printCertificate, CERTIFICATE_HTML_TEMPLATE } from "@/lib/certificate-styles";
import { generatePdfServerSide, streamPdfForDownload } from "@/lib/certificate-pdf-service";

const toastErr = (e: unknown) => toast.error((e as any)?.message ?? String(e));

/* Legacy bonafide template (from legacy/certificates/bonafide-template.html)
   Integrated here so previews use the same layout when template HTML isn't provided */
const DEFAULT_BONAFIDE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GCT Bonafide Certificate Template</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #f3f3f3;
      font-family: "Times New Roman", serif;
      color: #000;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      padding: 28mm 22mm 24mm;
      border: 1px solid #222;
      position: relative;
    }
    .center { text-align: center; }
    .college-name { font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .college-place { margin-top: 4px; font-size: 18px; font-weight: 700; text-transform: uppercase; }
    .college-affiliation { margin-top: 4px; font-size: 16px; }
    .meta { margin-top: 28px; display: flex; justify-content: space-between; font-size: 17px; }
    .title {
      margin-top: 26px;
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      text-transform: uppercase;
      text-decoration: underline;
      letter-spacing: 0.5px;
    }
    .content { margin-top: 34px; font-size: 20px; line-height: 2.05; text-align: justify; }
    .fill {
      display: inline-block;
      min-width: 130px;
      border-bottom: 1px dotted #000;
      padding: 0 6px 2px;
      text-align: center;
      font-weight: 700;
    }
    .fill-sm { min-width: 90px; }
    .fill-md { min-width: 180px; }
    .fill-lg { min-width: 260px; }
    .fill-xl { min-width: 340px; }
    .to-block { margin-top: 38px; font-size: 19px; line-height: 1.9; }
    .signature { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
    .seal-box {
      width: 160px;
      height: 160px;
      border: 1px dashed #444;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 16px;
    }
    .sign-area { width: 260px; text-align: center; font-size: 18px; }
    .sign-line { border-top: 1px solid #000; padding-top: 8px; margin-top: 60px; font-weight: 700; }
    .qr-image {
      position: absolute;
      bottom: 20mm;
      right: 10mm;
      width: 30mm;
      height: 30mm;
      border: 1px solid #000;
      object-fit: contain;
    }
    @page { size: A4; margin: 20mm; }
    /* tighten print margins and QR sizing for better layout */
    @media print {
      .qr-image { width: 25mm; height: 25mm; right: 12mm; bottom: 18mm; }
      .page { padding: 12mm 14mm; }
    }
    @media print {
      body { background: #fff; padding: 0; }
      .page {
        border: none;
        box-shadow: none;
        margin: 0;
        width: 100%;
        min-height: 100vh;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="center">
      <div class="college-name">Government College of Technology</div>
      <div class="college-place">Coimbatore - 641013</div>
      <div class="college-affiliation">(Affiliated to Anna University, Chennai)</div>
    </div>

    <div class="meta">
      <div><strong>No.</strong> <span class="fill fill-md">{{NO}}</span></div>
      <div><strong>Dated:</strong> <span class="fill fill-md">{{DATED}}</span></div>
    </div>

    <div class="title">Bonafide Certificate</div>

    <div class="content">
      This is to certify that <span class="fill fill-xl">{{NAME}}</span>
      (Roll No. <span class="fill fill-md">{{ROLL}}</span>) is a bonafide
      student of this college studying in <span class="fill fill-sm">{{YEAR}}</span> year
      of Four years of B.E./B.Tech. Degree course in
      <span class="fill fill-lg">{{BRANCH}}</span> during the academic year
      <span class="fill fill-md">{{ACADEMIC_YEAR}}</span>.

      <br><br>

      This certificate is issued with reference to his/her application dated
      <span class="fill fill-md">{{APPLICATION_DATE}}</span> to apply for
      <span class="fill fill-lg">{{APPLICATION_PURPOSE}}</span>.
    </div>

    <div class="to-block">
      <strong>To</strong><br>
      <span class="fill fill-lg">{{AUTHORITY}}</span>
    </div>

    <div class="signature">
      <div class="seal-box">Office Seal</div>

      <div class="sign-area">
        <div class="sign-line">Office of the Principal</div>
      </div>
    </div>

    <img class="qr-image" src="{{QR_SRC}}" alt="Verification QR" />
  </div>
</body>
</html>`;

export default function Certificates() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("templates");

  const { data: templates, isLoading: tl } = useQuery({ queryKey: ["cert-templates"], queryFn: getTemplates });
  const { data: requests, isLoading: rl } = useQuery({ queryKey: ["cert-requests"], queryFn: () => getRequests() });
  const { data: students } = useQuery({ queryKey: ["student-register"], queryFn: fetchStudentRegister });

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
  const previewRef = useRef<HTMLDivElement | null>(null);

  function renderCertificateHtml(req: CertRequestJoined) {
    const tpl = (req.template_body as string) ?? (req.template_html as string) ?? req.template ?? DEFAULT_BONAFIDE_TEMPLATE ?? CERTIFICATE_HTML_TEMPLATE;
    const data = prepareCertificateData({
      student_name: req.student_name,
      admission_no: req.admission_no,
      template_name: req.template_name ?? req.template ?? "",
      template_code: req.template_code ?? "",
      purpose: req.purpose ?? undefined,
      issued_at: req.issued_at ?? undefined,
      qr_token: req.qr_token ?? undefined,
      // include legacy fields for backward compatibility
      NAME: req.student_name ?? undefined,
      ROLL: req.admission_no ?? undefined,
      YEAR: (req as any).year ?? undefined,
      BRANCH: (req as any).branch ?? undefined,
      ACADEMIC_YEAR: (req as any).academic_year ?? undefined,
      APPLICATION_DATE: req.issued_at ?? undefined,
      APPLICATION_PURPOSE: req.purpose ?? undefined,
      AUTHORITY: (req as any).authority ?? undefined,
      NO: (req as any).no ?? undefined,
      DATED: (req as any).dated ?? req.issued_at ?? undefined,
      qr_token_short: ((req as any).qr_token ?? "").slice(0, 16),
      qr_src: (req as any).qr_base64 ? `data:image/png;base64,${(req as any).qr_base64}` : undefined,
    } as Record<string, any>);

    // generateCertificateHtml will substitute variables and conditionals
    return generateCertificateHtml(tpl, data as Record<string, string | boolean | undefined>);
  }

  const openPreview = (r: CertRequestJoined) => {
    setPreviewReq(r);
    setPreviewOpen(true);
  };

  const handlePrintPreview = () => {
    if (!previewReq) return;
    try {
      const html = renderCertificateHtml(previewReq);
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
        templateHtml: renderCertificateHtml(previewReq),
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
        templateHtml: renderCertificateHtml(previewReq),
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

  // ── QR Verify ──
  const [qrToken, setQrToken] = useState("");
  const [qrResult, setQrResult] = useState<CertRequestJoined | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

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

  const issued = (requests ?? []).filter((r) => r.status === "issued");
  const pending = (requests ?? []).filter((r) => r.status === "requested" || r.status === "approved");

  const pag1 = usePagination({ data: requests ?? [], pageSize: 10 });
  const pag2 = usePagination({ data: issued, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Certificates Engine" subtitle="Templates, requests, QR verification & bulk generation" icon={<Award className="h-6 w-6" />} />

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
            <p className="text-sm text-muted-foreground">{requests?.length ?? 0} requests</p>
            <Button size="sm" className="w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto" onClick={() => { setReqTplId(""); setReqStudentId(""); setReqPurpose(""); setReqOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New Request
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <TablePagination {...pag1} />
            <Table className="min-w-max">
              <TableHeader className="">
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Template</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">QR Token</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(requests ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No requests yet</TableCell></TableRow>
                )}
                {pag1.pageData.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><span className="text-sm font-medium">{r.student_name ?? "—"}</span><br /><span className="text-[10px] text-muted-foreground">{r.admission_no ?? ""}</span></TableCell>
                    <TableCell><span className="text-xs">{r.template_name ?? "—"}</span><br /><span className="text-[10px] text-muted-foreground">{r.template_code ?? ""}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.purpose ?? "—"}</TableCell>
                    <TableCell><Badge className={`border text-[10px] ${getStatusColor(r.status)}`}>{r.status}</Badge></TableCell>
                    <TableCell><code className="text-[10px] font-mono text-muted-foreground">{(r.qr_token ?? "").slice(0, 16)}…</code></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {r.status === "requested" && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => approveMut.mutate(r.id)} disabled={approveMut.isPending}><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                        )}
                        {r.status === "approved" && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => issueMut.mutate(r.id)} disabled={issueMut.isPending}><FileDown className="h-3 w-3 mr-1" /> Issue</Button>
                        )}
                        {(r.status === "requested" || r.status === "approved" || r.status === "issued") && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { setRevokeId(r.id); setRevokeReason(""); }}><Ban className="h-3 w-3 mr-1" /> Revoke</Button>
                        )}
                        {(r.status === "requested" || r.status === "revoked") && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => { if (confirm("Delete this request?")) delReqMut.mutate(r.id); }} disabled={delReqMut.isPending}><Trash2 className="h-3 w-3 mr-1" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ══════ QR VERIFY ══════ */}
        <TabsContent value="qr-verify">
          <Card className="mx-auto max-w-lg">
            <CardHeader><CardTitle className="text-sm">Verify Certificate</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input id="qrToken" name="qrToken" placeholder="Enter QR token" value={qrToken} onChange={(e) => setQrToken(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleVerify()} />
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
                  <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs" onClick={() => { navigator.clipboard.writeText(qrResult.qr_token); toast.success("Token copied"); }}><Copy className="h-3 w-3 mr-1" /> Copy Token</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ ISSUANCE LOG ══════ */}
        <TabsContent value="issued">
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
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogHeader><DialogTitle>Certificate Preview</DialogTitle></DialogHeader>
          <div className="p-6" ref={previewRef} style={{ background: '#fff' }}>
            <div className="certificate" dangerouslySetInnerHTML={{ __html: previewReq ? renderCertificateHtml(previewReq) : '' }} />
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrintPreview}>Print</Button>
              <Button onClick={handleDownloadPdf}>Download PDF</Button>
              {import.meta.env.VITE_CERT_SERVER_URL && (
                <Button variant="secondary" onClick={handleSignedExport}>Signed Export</Button>
              )}
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Close</Button>
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

      {/* ══════ REVOKE DIALOG ══════ */}
      <Dialog open={!!revokeId} onOpenChange={(o) => { if (!o) setRevokeId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Revoke Certificate</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <div>
              <Label className="text-xs" htmlFor="revokeReason">Reason</Label>
              <Textarea id="revokeReason" name="revokeReason" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={3} placeholder="e.g. Issued in error" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => revokeMut.mutate()} disabled={!revokeReason || revokeMut.isPending}>
              {revokeMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
