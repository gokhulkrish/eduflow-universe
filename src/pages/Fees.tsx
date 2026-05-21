import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { useDbList } from "@/hooks/useDbList";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Structure = { id: string; name: string; grade: string|null; amount: number; frequency: string; due_day: number|null };
type Invoice = { id: string; invoice_no: string; amount: number; amount_paid: number; due_date: string|null; status: string; student_id: string };

const statusTone: Record<string,string> = {
  paid: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Fees() {
  const { data: structures, loading: l1 } = useDbList<Structure>("fee_structures");
  const { data: invoices, loading: l2 } = useDbList<Invoice>("fee_invoices", { order: { column: "created_at", ascending: false } });

  const totalDue = invoices.reduce((s,i) => s + Number(i.amount) - Number(i.amount_paid), 0);
  const totalCollected = invoices.reduce((s,i) => s + Number(i.amount_paid), 0);

  return (
    <div>
      <PageHeader title="Fees & Payments" subtitle="Structures, invoices and collection ledger" icon={<CreditCard className="h-6 w-6" />} />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Active Structures", value: structures.length },
          { label: "Total Collected", value: `₹${totalCollected.toLocaleString()}` },
          { label: "Outstanding", value: `₹${totalDue.toLocaleString()}` },
        ].map(k => (
          <Card key={k.label} className="glass p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{k.value}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="structures">
        <TabsList><TabsTrigger value="structures">Structures</TabsTrigger><TabsTrigger value="invoices">Invoices</TabsTrigger></TabsList>
        <TabsContent value="structures" className="mt-4">
          <DataTable rows={structures} loading={l1} columns={[
            { key: "name", header: "Plan" },
            { key: "grade", header: "Grade" },
            { key: "amount", header: "Amount", render: r => `₹${Number(r.amount).toLocaleString()}` },
            { key: "frequency", header: "Frequency" },
            { key: "due_day", header: "Due Day" },
          ]} />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <DataTable rows={invoices} loading={l2} empty="No invoices yet — create one from a fee structure." columns={[
            { key: "invoice_no", header: "Invoice", className: "font-mono text-xs" },
            { key: "amount", header: "Amount", render: r => `₹${Number(r.amount).toLocaleString()}` },
            { key: "amount_paid", header: "Paid", render: r => `₹${Number(r.amount_paid).toLocaleString()}` },
            { key: "due_date", header: "Due" },
            { key: "status", header: "Status", render: r => <Badge className={`border ${statusTone[r.status] ?? ""}`}>{r.status}</Badge> },
          ]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
