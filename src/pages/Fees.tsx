import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard, Plus, Search, Save, X, Loader2, Calendar, Users,
  DollarSign, Receipt, BarChart3, AlertTriangle, CheckCircle2, Edit3,
  Trash2, Eye, RotateCcw, Printer, Download, BookOpen, History,
  Percent, Bell, UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchStudentRegister } from "@/lib/student-records";
import {
  getFeeStructures, saveFeeStructure, deleteFeeStructure,
  getFeeInvoices, createFeeInvoice, deleteFeeInvoice,
  getPaymentsForInvoice, getAllPayments, recordPayment, processRefund,
  getInvoicesWithDetails, getDefaulterReport, getCollectionSummary,
  getConcessionsForInvoice, getAllConcessions, saveConcession, deleteConcession,
  sendFeeReminder, getAllReminders, getFeeLedger, getStudentFeeRecords,
  getEffectiveOutstanding,
  getInvoiceStatus, calculateOutstanding,
  type FeeStructure, type FeeInvoice, type FeePayment,
  type InvoiceWithStudent, type DefaulterRow,
  type FeeConcession, type FeeReminder, type FeeLedgerEntry, type StudentFeeRecord,
} from "@/lib/fees";

const statusColors: Record<string, string> = {
  paid: "bg-success/15 text-success",
  partial: "bg-warning/15 text-warning",
  pending: "bg-muted text-muted-foreground",
  overdue: "bg-destructive/15 text-destructive",
};
const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
  { value: "cheque", label: "Cheque" },
];

const emptyStructure = () => ({
  name: "", grade: "", amount: 0, frequency: "annual", due_day: 1, academic_year_id: null as string | null,
});

export default function Fees() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("invoices");
  const [search, setSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");

  const [structOpen, setStructOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState<FeeStructure | null>(null);
  const [structDraft, setStructDraft] = useState(emptyStructure());

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invStudentId, setInvStudentId] = useState("");
  const [invStructureId, setInvStructureId] = useState("all");
  const [invAmount, setInvAmount] = useState(0);
  const [invDueDate, setInvDueDate] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<FeeInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");

  const [viewPaymentsOpen, setViewPaymentsOpen] = useState(false);
  const [viewPaymentsInvoice, setViewPaymentsInvoice] = useState<FeeInvoice | null>(null);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundInvoice, setRefundInvoice] = useState<FeeInvoice | null>(null);
  const [refundAmount, setRefundAmount] = useState(0);

  const [concessionOpen, setConcessionOpen] = useState(false);
  const [concessionInvoice, setConcessionInvoice] = useState<FeeInvoice | null>(null);
  const [concessionAmount, setConcessionAmount] = useState(0);
  const [concessionReason, setConcessionReason] = useState("");
  const [concessionType, setConcessionType] = useState("scholarship");

  const [ledgerStudentFilter, setLedgerStudentFilter] = useState("all");

  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderStudent, setReminderStudent] = useState<DefaulterRow | null>(null);
  const [reminderChannel, setReminderChannel] = useState("email");

  // ── Queries ──
  const studentsQuery = useQuery({
    queryKey: ["student-register", "fees"],
    queryFn: fetchStudentRegister,
    staleTime: 60_000,
  });
  const structuresQuery = useQuery({
    queryKey: ["fee-structures"],
    queryFn: getFeeStructures,
  });
  const invoicesQuery = useQuery({
    queryKey: ["fee-invoices"],
    queryFn: getInvoicesWithDetails,
  });
  const paymentsQuery = useQuery({
    queryKey: ["fee-payments"],
    queryFn: getAllPayments,
  });
  const defaultersQuery = useQuery({
    queryKey: ["fee-defaulters"],
    queryFn: getDefaulterReport,
  });
  const collectionQuery = useQuery({
    queryKey: ["fee-collection"],
    queryFn: getCollectionSummary,
  });
  const concessionsQuery = useQuery({
    queryKey: ["fee-concessions"],
    queryFn: getAllConcessions,
  });
  const ledgerQuery = useQuery({
    queryKey: ["fee-ledger", ledgerStudentFilter],
    queryFn: () => getFeeLedger(ledgerStudentFilter !== "all" ? ledgerStudentFilter : undefined),
  });
  const feeRecordsQuery = useQuery({
    queryKey: ["fee-records"],
    queryFn: getStudentFeeRecords,
  });
  const remindersQuery = useQuery({
    queryKey: ["fee-reminders"],
    queryFn: getAllReminders,
  });

  const structures = structuresQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const defaulters = defaultersQuery.data ?? [];
  const collection = collectionQuery.data ?? [];
  const concessions = concessionsQuery.data ?? [];
  const ledger = ledgerQuery.data ?? [];
  const feeRecords = feeRecordsQuery.data ?? [];
  const reminders = remindersQuery.data ?? [];
  const students = studentsQuery.data ?? [];

  const studentOptions = useMemo(
    () => [...new Map(students.map((s) => [s.id, s])).values()],
    [students],
  );

  // ── Derived ──
  const totalCollected = useMemo(
    () => payments.filter((p) => Number(p.amount) > 0).reduce((s, p) => s + Number(p.amount), 0),
    [payments],
  );
  const totalOutstanding = useMemo(
    () => invoices.reduce((s, i) => s + calculateOutstanding(i), 0),
    [invoices],
  );
  const overdueCount = useMemo(
    () => invoices.filter((i) => getInvoiceStatus(i) === "overdue").length,
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    let r = invoices;
    if (invoiceStatusFilter !== "all") r = r.filter((i) => getInvoiceStatus(i) === invoiceStatusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(
        (i) => i.invoice_no.toLowerCase().includes(q)
          || (i.student_name ?? "").toLowerCase().includes(q)
          || i.student_admission_no?.toLowerCase().includes(q),
      );
    }
    return r;
  }, [invoices, invoiceStatusFilter, search]);

  // ── Mutations ──
  const saveStructMut = useMutation({
    mutationFn: (s: Parameters<typeof saveFeeStructure>[0]) => saveFeeStructure(s),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["fee-structures"] });
      toast.success(editingStruct ? `Updated "${saved.name}"` : `Created "${saved.name}"`);
      setStructOpen(false); setEditingStruct(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteStructMut = useMutation({
    mutationFn: (id: string) => deleteFeeStructure(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-structures"] }); toast.success("Structure deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const createInvoiceMut = useMutation({
    mutationFn: (inv: Parameters<typeof createFeeInvoice>[0]) => createFeeInvoice(inv),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-invoices"] }); toast.success("Invoice created"); setInvoiceOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteInvoiceMut = useMutation({
    mutationFn: (id: string) => deleteFeeInvoice(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-invoices"] }); toast.success("Invoice deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const recordPaymentMut = useMutation({
    mutationFn: (p: Parameters<typeof recordPayment>[0]) => recordPayment(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-payments"] });
      qc.invalidateQueries({ queryKey: ["fee-invoices"] });
      qc.invalidateQueries({ queryKey: ["fee-defaulters"] });
      qc.invalidateQueries({ queryKey: ["fee-collection"] });
      toast.success("Payment recorded");
      setPaymentOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const refundMut = useMutation({
    mutationFn: ({ invoiceId, amount }: { invoiceId: string; amount: number }) => processRefund(invoiceId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-invoices"] });
      qc.invalidateQueries({ queryKey: ["fee-payments"] });
      toast.success("Refund processed");
      setRefundOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveConcessionMut = useMutation({
    mutationFn: (c: Parameters<typeof saveConcession>[0]) => saveConcession(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-concessions"] });
      qc.invalidateQueries({ queryKey: ["fee-invoices"] });
      toast.success("Concession applied");
      setConcessionOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteConcessionMut = useMutation({
    mutationFn: (id: string) => deleteConcession(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-concessions"] }); toast.success("Concession removed"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const sendReminderMut = useMutation({
    mutationFn: ({ studentId, channel, invoiceIds, totalDue }: { studentId: string; channel: string; invoiceIds: string[]; totalDue: number }) =>
      sendFeeReminder(studentId, channel, invoiceIds, totalDue),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-reminders"] });
      toast.success("Reminder sent");
      setReminderOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Handlers ──
  const handleNewStruct = () => { setEditingStruct(null); setStructDraft(emptyStructure()); setStructOpen(true); };
  const handleEditStruct = (s: FeeStructure) => { setEditingStruct(s); setStructDraft({ ...s }); setStructOpen(true); };
  const handleSaveStruct = () => {
    if (!structDraft.name.trim() || !structDraft.amount) { toast.error("Name and amount are required."); return; }
    saveStructMut.mutate(editingStruct ? { ...structDraft, id: editingStruct.id } : structDraft);
  };

  const handleNewInvoice = () => { setInvStudentId(""); setInvStructureId("all"); setInvAmount(0); setInvDueDate(""); setInvoiceOpen(true); };
  const handleCreateInvoice = () => {
    if (!invStudentId || !invAmount) { toast.error("Student and amount are required."); return; }
    createInvoiceMut.mutate({
      student_id: invStudentId,
      fee_structure_id: invStructureId !== "all" ? invStructureId : null,
      amount: invAmount,
      due_date: invDueDate || null,
    });
  };

  const handleOpenPayment = (inv: FeeInvoice) => {
    setPaymentInvoice(inv);
    setPaymentAmount(calculateOutstanding(inv));
    setPaymentMethod("cash");
    setPaymentRef("");
    setPaymentOpen(true);
  };
  const handleRecordPayment = () => {
    if (!paymentInvoice || !paymentAmount) { toast.error("Amount is required."); return; }
    recordPaymentMut.mutate({ invoice_id: paymentInvoice.id, amount: paymentAmount, method: paymentMethod, reference: paymentRef || null, received_by: null });
  };

  const handleViewPayments = async (inv: FeeInvoice) => {
    setViewPaymentsInvoice(inv);
    setViewPaymentsOpen(true);
  };

  const statusBadge = (status: string) => (
    <Badge variant="secondary" className={statusColors[status] ?? ""}>{status}</Badge>
  );

  const invoiceStatusBadge = (inv: FeeInvoice) => statusBadge(getInvoiceStatus(inv));

  return (
    <div>
      <PageHeader
        title="Fees & Payments"
        subtitle="Multi-gateway · installments · receipts · defaulter reports · scholarship adjustments"
        icon={<CreditCard className="h-6 w-6" />}
        actions={
          <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90" onClick={handleNewInvoice}>
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          { label: "Fee Structures", value: structures.length, color: "text-primary", icon: CreditCard },
          { label: "Total Collected", value: `₹${totalCollected.toLocaleString()}`, color: "text-success", icon: DollarSign },
          { label: "Outstanding", value: `₹${totalOutstanding.toLocaleString()}`, color: "text-warning", icon: AlertTriangle },
          { label: "Overdue Invoices", value: overdueCount, color: "text-destructive", icon: AlertTriangle },
        ].map((k) => (
          <Card key={k.label} className="glass p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className={`mt-1 font-display text-3xl font-bold ${k.color}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 w-full flex-nowrap overflow-x-auto">
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="structures">Structures ({structures.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="concessions">Concessions ({concessions.length})</TabsTrigger>
          <TabsTrigger value="fee-records">Fee Records ({feeRecords.length})</TabsTrigger>
          <TabsTrigger value="ledger">Ledger ({ledger.length})</TabsTrigger>
          <TabsTrigger value="defaulters">Defaulters ({defaulters.length})</TabsTrigger>
          <TabsTrigger value="reminders">Reminders ({reminders.length})</TabsTrigger>
          <TabsTrigger value="collection">Collections</TabsTrigger>
        </TabsList>

        {/* ══════ INVOICES ══════ */}
        <TabsContent value="invoices">
          <Card className="glass p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoices…" className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9" />
              </div>
              <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto sm:shrink-0" onClick={handleNewInvoice}>
                <Plus className="mr-2 h-4 w-4" /> New Invoice
              </Button>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No invoices found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((inv) => {
                  const outst = calculateOutstanding(inv);
                  const pct = Number(inv.amount) > 0 ? (Number(inv.amount_paid) / Number(inv.amount)) * 100 : 0;
                  return (
                    <Card key={inv.id} className="border-border/60 bg-card/60 p-4 hover-lift">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{inv.invoice_no}</span>
                            {invoiceStatusBadge(inv)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-gradient-primary text-[10px] text-primary-foreground">
                                {(inv.student_name?.[0] ?? "?").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{inv.student_name ?? "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{inv.student_admission_no} · Grade {inv.student_grade} {inv.structure_name ? `· ${inv.structure_name}` : ""}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="font-semibold">₹{Number(inv.amount).toLocaleString()}</span>
                            <span className="text-muted-foreground">Paid: ₹{Number(inv.amount_paid).toLocaleString()}</span>
                            {outst > 0 && <span className="text-destructive">Due: ₹{outst.toLocaleString()}</span>}
                            {inv.due_date && <span className="text-xs text-muted-foreground"><Calendar className="inline h-3 w-3 mr-1" />{inv.due_date}</span>}
                          </div>
                          <Progress value={pct} className="mt-2 h-1.5" />
                        </div>
                        <div className="flex flex-wrap gap-1 sm:justify-end">
                          <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs"
                            onClick={() => handleOpenPayment(inv)} disabled={getInvoiceStatus(inv) === "paid"}>
                            <DollarSign className="h-3 w-3 mr-1" /> Pay
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs"
                            onClick={() => { setConcessionInvoice(inv); setConcessionAmount(0); setConcessionReason(""); setConcessionType("scholarship"); setConcessionOpen(true); }}>
                            <Percent className="h-3 w-3 mr-1" /> Concession
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs"
                            onClick={() => handleViewPayments(inv)}>
                            <Eye className="h-3 w-3 mr-1" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="rounded-lg h-8 text-xs text-destructive hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                                <AlertDialogDescription>{inv.invoice_no} — This also removes all payments.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteInvoiceMut.mutate(inv.id)} className="bg-destructive">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ STRUCTURES ══════ */}
        <TabsContent value="structures">
          <Card className="glass p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Manage fee structures that define the amounts students are billed.</p>
              <Button onClick={handleNewStruct} className="rounded-xl bg-gradient-primary shadow-glow shrink-0">
                <Plus className="mr-2 h-4 w-4" /> Add Structure
              </Button>
            </div>
            {structures.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No fee structures yet. Click "Add Structure" to create one.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {structures.map((s) => (
                  <Card key={s.id} className="border-border/60 bg-card/60 p-4 hover-lift">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">Grade {s.grade ?? "All"} · {s.frequency}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => handleEditStruct(s)}><Edit3 className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete "{s.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteStructMut.mutate(s.id)} className="bg-destructive">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="font-display text-2xl font-bold text-primary">₹{Number(s.amount).toLocaleString()}</p>
                    {s.due_day && <p className="text-xs text-muted-foreground mt-1">Due day: {s.due_day}th of the period</p>}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ PAYMENTS ══════ */}
        <TabsContent value="payments">
          <Card className="glass p-4">
            {payments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No payments recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.filter((p) => Number(p.amount) > 0).map((p) => {
                  const inv = invoices.find((i) => i.id === p.invoice_id);
                  return (
                    <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15">
                        <DollarSign className="h-4 w-4 text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">₹{Number(p.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv?.student_name ?? "Unknown"} · {inv?.invoice_no ?? "—"} · {p.method}
                          {p.reference ? ` · Ref: ${p.reference}` : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <p>{new Date(p.paid_at).toLocaleDateString()}</p>
                        <p>{new Date(p.paid_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs"
                        onClick={() => { const i = invoices.find((inv) => inv.id === p.invoice_id); if (i) handleViewPayments(i); }}>
                        <Receipt className="h-3 w-3 mr-1" /> Receipt
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ DEFAULTERS ══════ */}
        <TabsContent value="defaulters">
          <Card className="glass p-4">
            {defaulters.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No defaulters. All dues are cleared.
              </div>
            ) : (
              <div className="space-y-3">
                {defaulters.map((d) => (
                  <Card key={d.student_id} className="border-border/60 bg-card/60 p-4 hover-lift">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-gradient-primary text-[10px] text-primary-foreground">
                              {(d.student_name[0] ?? "?").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{d.student_name}</span>
                          <Badge variant="secondary" className="bg-destructive/15 text-destructive text-[10px]">
                            ₹{d.outstanding.toLocaleString()} due
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{d.admission_no} · Grade {d.grade} · {d.invoice_count} invoice(s)</p>
                        {d.last_payment_date && <p className="text-xs text-muted-foreground mt-1">Last payment: {new Date(d.last_payment_date).toLocaleDateString()}</p>}
                      </div>
                      <div className="flex flex-wrap gap-1 sm:justify-end sm:items-start">
                        <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs"
                          onClick={() => { setReminderStudent(d); setReminderChannel("email"); setReminderOpen(true); }}>
                          <Bell className="h-3 w-3 mr-1" /> Remind
                        </Button>
                      </div>
                      <Progress value={(d.total_paid / d.total_due) * 100} className="w-24 h-2 mt-2" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ CONCESSIONS ══════ */}
        <TabsContent value="concessions">
          <Card className="glass p-4">
            {concessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No concessions applied. Select an invoice and apply a concession from the Invoices tab.
              </div>
            ) : (
              <div className="space-y-3">
                {concessions.map((c) => {
                  const inv = invoices.find((i) => i.id === c.invoice_id);
                  return (
                    <div key={c.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-info/15">
                        <Percent className="h-4 w-4 text-info" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">₹{Number(c.amount).toLocaleString()} — {c.type.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv?.student_name ?? "Unknown"} · {inv?.invoice_no ?? "—"} · {c.reason || "No reason"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Remove concession?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteConcessionMut.mutate(c.id)} className="bg-destructive">Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ FEE RECORDS ══════ */}
        <TabsContent value="fee-records">
          <Card className="glass p-4">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by student name or admission no…"
                className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9 flex-1" />
            </div>
            {feeRecords.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No fee records available.
              </div>
            ) : (
              <div className="space-y-3">
                {feeRecords.map((r) => (
                  <Card key={r.student_id} className="border-border/60 bg-card/60 p-4 hover-lift">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-gradient-primary text-[10px] text-primary-foreground">
                              {(r.student_name[0] ?? "?").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{r.student_name}</span>
                          <Badge variant="secondary" className={r.outstanding > 0 ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}>
                            {r.outstanding > 0 ? `₹${r.outstanding.toLocaleString()} due` : "Cleared"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.admission_no} · Grade {r.grade} · {r.invoice_count} invoice(s)</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          <div><span className="text-muted-foreground">Billed:</span> ₹{r.total_billed.toLocaleString()}</div>
                          <div><span className="text-muted-foreground">Concessions:</span> ₹{r.total_concessions.toLocaleString()}</div>
                          <div><span className="text-muted-foreground">Paid:</span> ₹{r.total_paid.toLocaleString()}</div>
                          <div><span className="text-muted-foreground">Net:</span> ₹{r.net_billed.toLocaleString()}</div>
                        </div>
                        <Progress value={r.total_billed > 0 ? (r.total_paid / r.net_billed) * 100 : 0} className="mt-2 h-1.5" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ LEDGER ══════ */}
        <TabsContent value="ledger">
          <Card className="glass p-4">
            <div className="mb-4 flex items-center gap-3">
              <Select value={ledgerStudentFilter} onValueChange={setLedgerStudentFilter}>
                <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All students" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {students.slice(0, 50).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{ledger.length} entries</span>
            </div>
            {ledger.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No ledger entries yet.
              </div>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {ledger.map((e) => (
                    <div key={e.id} className="flex flex-col gap-2 rounded-lg border border-border/30 bg-card/40 p-2.5 text-xs sm:flex-row sm:items-center">
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      e.type === "invoice" ? "bg-primary/15" :
                      e.type === "payment" ? "bg-success/15" :
                      e.type === "concession" ? "bg-info/15" :
                      e.type === "refund" ? "bg-destructive/15" : "bg-muted",
                    )}>
                      {e.type === "invoice" ? <Receipt className="h-3 w-3" /> :
                       e.type === "payment" ? <DollarSign className="h-3 w-3" /> :
                       e.type === "concession" ? <Percent className="h-3 w-3" /> :
                       e.type === "refund" ? <RotateCcw className="h-3 w-3" /> :
                       <Bell className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="capitalize font-medium">{e.type}</p>
                      <p className="text-muted-foreground truncate">{e.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {e.debit > 0 && <p className="text-destructive font-medium">+₹{e.debit.toLocaleString()}</p>}
                      {e.credit > 0 && <p className="text-success font-medium">-₹{e.credit.toLocaleString()}</p>}
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <p className="font-mono font-medium">₹{e.balance.toLocaleString()}</p>
                      <p className="text-muted-foreground">{new Date(e.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ REMINDERS ══════ */}
        <TabsContent value="reminders">
          <Card className="glass p-4">
            {reminders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No reminders sent. Go to Defaulters tab to send reminders.
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.map((r) => {
                  const student = students.find((s) => s.id === r.student_id);
                  return (
                    <div key={r.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/15">
                        <Bell className="h-4 w-4 text-warning" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{student?.display_name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          ₹{r.total_due.toLocaleString()} via {r.channel} · {r.invoice_ids.length} invoice(s)
                        </p>
                      </div>
                      <Badge variant="secondary" className={r.status === "sent" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>{r.status}</Badge>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(r.sent_at).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════ COLLECTION REPORT ══════ */}
        <TabsContent value="collection">
          <Card className="glass p-4">
            {collection.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                No collection data yet.
              </div>
            ) : (
              <div className="space-y-3">
                {collection.map((c) => {
                  const methodEntries = Object.entries(c.method_breakdown);
                  return (
                    <Card key={c.period} className="border-border/60 bg-card/60 p-4 hover-lift">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                        <div>
                          <p className="font-medium">{c.period}</p>
                          <p className="text-xs text-muted-foreground">{c.transaction_count} transactions</p>
                        </div>
                        <p className="font-display text-xl font-bold text-success">₹{c.total_collected.toLocaleString()}</p>
                      </div>
                      {methodEntries.length > 0 && (
                        <div className="space-y-1.5">
                          {methodEntries.map(([method, amount]) => (
                            <div key={method} className="flex items-center gap-2 text-xs">
                              <span className="w-28 capitalize">{method.replace("_", " ")}</span>
                              <Progress value={(amount / c.total_collected) * 100} className="h-2 flex-1" />
                              <span className="w-20 text-right text-muted-foreground">₹{amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════ STRUCTURE DIALOG ══════ */}
      <Dialog open={structOpen} onOpenChange={setStructOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingStruct ? "Edit Fee Structure" : "New Fee Structure"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={structDraft.name} onChange={(e) => setStructDraft({ ...structDraft, name: e.target.value })} placeholder="Tuition Fee" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Grade</Label>
                <Select value={structDraft.grade} onValueChange={(v: string) => setStructDraft({ ...structDraft, grade: v })}>
                  <SelectTrigger><SelectValue placeholder="All grades" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All grades</SelectItem>
                    {[...new Set(students.map((s) => s.grade).filter(Boolean))].sort().map((g) => (
                      <SelectItem key={g} value={g!}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Frequency</Label>
                <Select value={structDraft.frequency} onValueChange={(v: string) => setStructDraft({ ...structDraft, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="semester">Semester</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount (₹)</Label>
                <Input type="number" min={0} value={structDraft.amount || ""}
                  onChange={(e) => setStructDraft({ ...structDraft, amount: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Due Day</Label>
                <Input type="number" min={1} max={31} value={structDraft.due_day ?? ""}
                  onChange={(e) => setStructDraft({ ...structDraft, due_day: Number(e.target.value) || null })} />
              </div>
            </div>
            <Button className="w-full rounded-xl bg-gradient-primary shadow-glow" onClick={handleSaveStruct} disabled={saveStructMut.isPending}>
              {saveStructMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editingStruct ? "Update Structure" : "Create Structure"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ INVOICE DIALOG ══════ */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Student</Label>
              <Select value={invStudentId} onValueChange={setInvStudentId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {studentOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.display_name} ({s.admission_no})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fee Structure (optional, sets amount)</Label>
              <Select value={invStructureId} onValueChange={(v) => {
                setInvStructureId(v);
                if (v !== "all") {
                  const str = structures.find((s) => s.id === v);
                  if (str) setInvAmount(Number(str.amount));
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Select structure" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Custom amount</SelectItem>
                  {structures.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — ₹{Number(s.amount).toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Amount (₹)</Label>
              <Input type="number" min={0} value={invAmount || ""} onChange={(e) => setInvAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} />
            </div>
            <Button className="w-full rounded-xl bg-gradient-primary shadow-glow" onClick={handleCreateInvoice} disabled={createInvoiceMut.isPending}>
              {createInvoiceMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ PAYMENT DIALOG ══════ */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {paymentInvoice && (
            <div className="space-y-4">
              <div className="rounded-xl bg-secondary/30 p-3 text-sm">
                <p className="font-medium">{paymentInvoice.invoice_no}</p>
                <p className="text-muted-foreground text-xs">Outstanding: ₹{calculateOutstanding(paymentInvoice).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-xs">Amount (₹)</Label>
                <Input type="number" min={0} value={paymentAmount || ""}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Reference (optional)</Label>
                <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Transaction ID / Cheque no." />
              </div>
              <Button className="w-full rounded-xl bg-gradient-primary shadow-glow" onClick={handleRecordPayment} disabled={recordPaymentMut.isPending}>
                {recordPaymentMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                Record Payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════ VIEW PAYMENTS DIALOG ══════ */}
      <Dialog open={viewPaymentsOpen} onOpenChange={setViewPaymentsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Payment History</DialogTitle></DialogHeader>
          {viewPaymentsInvoice && (
            <div className="space-y-3">
              <div className="rounded-xl bg-secondary/30 p-3">
                <p className="text-sm font-medium">{viewPaymentsInvoice.invoice_no}</p>
                <p className="text-xs text-muted-foreground">Total: ₹{Number(viewPaymentsInvoice.amount).toLocaleString()} · Paid: ₹{Number(viewPaymentsInvoice.amount_paid).toLocaleString()}</p>
                <Progress value={Number(viewPaymentsInvoice.amount) > 0 ? (Number(viewPaymentsInvoice.amount_paid) / Number(viewPaymentsInvoice.amount)) * 100 : 0} className="mt-2 h-1.5" />
              </div>
              <PaymentHistory invoiceId={viewPaymentsInvoice.id} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl"
                  onClick={() => { setRefundInvoice(viewPaymentsInvoice); setRefundAmount(0); setRefundOpen(true); setViewPaymentsOpen(false); }}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Refund
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════ REFUND DIALOG ══════ */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Process Refund</DialogTitle></DialogHeader>
          {refundInvoice && (
            <div className="space-y-4">
              <p className="text-sm">Refund for <strong>{refundInvoice.invoice_no}</strong></p>
              <p className="text-xs text-muted-foreground">Paid: ₹{Number(refundInvoice.amount_paid).toLocaleString()} · Max refund: ₹{Number(refundInvoice.amount_paid).toLocaleString()}</p>
              <div>
                <Label className="text-xs">Refund Amount (₹)</Label>
                <Input type="number" min={0} max={Number(refundInvoice.amount_paid)} value={refundAmount || ""}
                  onChange={(e) => setRefundAmount(Number(e.target.value))} />
              </div>
              <Button className="w-full rounded-xl bg-gradient-primary shadow-glow"
                onClick={() => refundMut.mutate({ invoiceId: refundInvoice.id, amount: refundAmount })}
                disabled={!refundAmount || refundMut.isPending}>
                {refundMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Process Refund
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════ CONCESSION DIALOG ══════ */}
      <Dialog open={concessionOpen} onOpenChange={setConcessionOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Apply Concession</DialogTitle></DialogHeader>
          {concessionInvoice && (
            <div className="space-y-4">
              <p className="text-sm">Concession for <strong>{concessionInvoice.invoice_no}</strong></p>
              <p className="text-xs text-muted-foreground">Invoice amount: ₹{Number(concessionInvoice.amount).toLocaleString()} · Paid: ₹{Number(concessionInvoice.amount_paid).toLocaleString()}</p>
              <div>
                <Label className="text-xs">Concession Amount (₹)</Label>
                <Input type="number" min={0} value={concessionAmount || ""}
                  onChange={(e) => setConcessionAmount(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={concessionType} onValueChange={setConcessionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                    <SelectItem value="merit">Merit</SelectItem>
                    <SelectItem value="need_based">Need-based</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Reason</Label>
                <Input value={concessionReason} onChange={(e) => setConcessionReason(e.target.value)} placeholder="e.g. 50% sibling discount" />
              </div>
              <Button className="w-full rounded-xl bg-gradient-primary shadow-glow"
                onClick={() => saveConcessionMut.mutate({
                  invoice_id: concessionInvoice.id,
                  student_id: concessionInvoice.student_id,
                  amount: concessionAmount,
                  reason: concessionReason,
                  type: concessionType,
                  approved_by: null,
                })}
                disabled={!concessionAmount || saveConcessionMut.isPending}>
                {saveConcessionMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Percent className="mr-2 h-4 w-4" />}
                Apply Concession
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════ REMINDER DIALOG ══════ */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Send Fee Reminder</DialogTitle></DialogHeader>
          {reminderStudent && (
            <div className="space-y-4">
              <p className="text-sm">Reminder for <strong>{reminderStudent.student_name}</strong></p>
              <p className="text-xs text-muted-foreground">Total outstanding: ₹{reminderStudent.outstanding.toLocaleString()} · {reminderStudent.invoice_count} overdue invoice(s)</p>
              <div>
                <Label className="text-xs">Channel</Label>
                <Select value={reminderChannel} onValueChange={setReminderChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full rounded-xl bg-gradient-primary shadow-glow"
                onClick={() => sendReminderMut.mutate({
                  studentId: reminderStudent.student_id,
                  channel: reminderChannel,
                  invoiceIds: invoices.filter((i) => i.student_id === reminderStudent.student_id).map((i) => i.id),
                  totalDue: reminderStudent.outstanding,
                })}
                disabled={sendReminderMut.isPending}>
                {sendReminderMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                Send Reminder
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Payment History sub-component ──

function PaymentHistory({ invoiceId }: { invoiceId: string }) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments-for-invoice", invoiceId],
    queryFn: () => getPaymentsForInvoice(invoiceId),
  });

  if (isLoading) return <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />;
  if (!payments || payments.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No payments recorded.</p>;
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-card/40 p-2.5 text-sm">
          <div>
            <span className={Number(p.amount) >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
              {Number(p.amount) >= 0 ? "+" : ""}₹{Number(p.amount).toLocaleString()}
            </span>
            <span className="ml-2 text-xs capitalize text-muted-foreground">{p.method.replace("_", " ")}</span>
            {p.reference && <span className="ml-2 text-xs text-muted-foreground">Ref: {p.reference}</span>}
          </div>
          <span className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
