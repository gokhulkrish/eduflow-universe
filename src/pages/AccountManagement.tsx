import { useEffect, useState } from "react";
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { subscribeAppSync } from "@/lib/app-sync";
import { transactionsKey, budgetsKey, getTransactions, createTransaction, deleteTransaction, getBudgets, createBudget, updateBudget, deleteBudget, CATEGORIES } from "@/lib/accounts";

export default function AccountManagement() {
  const [tab, setTab] = useState("overview");
  const [txs, setTxs] = useState(() => getTransactions());
  const [budgets, setBudgets] = useState(() => getBudgets());
  const refreshTxs = () => setTxs(getTransactions());
  const refreshBudgets = () => setBudgets(getBudgets());

  const [txOpen, setTxOpen] = useState(false); const [txDesc, setTxDesc] = useState(""); const [txCat, setTxCat] = useState(""); const [txType, setTxType] = useState<"income"|"expense">("income"); const [txAmt, setTxAmt] = useState(""); const [txRef, setTxRef] = useState("");
  const [bgOpen, setBgOpen] = useState(false); const [bgCat, setBgCat] = useState(""); const [bgAlloc, setBgAlloc] = useState(""); const [bgSpent, setBgSpent] = useState(""); const [bgYear, setBgYear] = useState("");

  const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  useEffect(() => subscribeAppSync([transactionsKey, budgetsKey], () => {
    refreshTxs();
    refreshBudgets();
  }), []);

  const pag1 = usePagination({ data: txs, pageSize: 10 });
  const pag2 = usePagination({ data: txs, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Account Management" subtitle="Financial tracking & budgeting" icon={<DollarSign className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Income</p><p className="text-2xl font-bold text-success">₹{totalIncome.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Expense</p><p className="text-2xl font-bold text-destructive">₹{totalExpense.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Net Balance</p><p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-success" : "text-destructive"}`}>₹{(totalIncome - totalExpense).toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Transactions</p><p className="text-2xl font-bold">{txs.length}</p></Card>
          </div>
          <Card><CardHeader><CardTitle className="text-sm">Recent Transactions</CardTitle></CardHeader><CardContent>
            <TablePagination {...pag1} />
            <Table>
              <TableHeader className=""><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Category</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {pag1.pageData.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{new Date(t.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{t.description}</TableCell>
                    <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{t.category}</Badge></TableCell>
                    <TableCell>{t.type === "income" ? <Badge className="text-[9px] bg-success/15 text-success"><TrendingUp className="h-3 w-3 mr-1" />Income</Badge> : <Badge className="text-[9px] bg-destructive/15 text-destructive"><TrendingDown className="h-3 w-3 mr-1" />Expense</Badge>}</TableCell>
                    <TableCell className="text-xs font-mono">₹{t.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {txs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No transactions</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setTxDesc(""); setTxCat(""); setTxType("income"); setTxAmt(""); setTxRef(""); setTxOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Transaction</Button></div>
          <TablePagination {...pag2} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Category</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Reference</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag2.pageData.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{t.description}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{t.category}</Badge></TableCell>
                  <TableCell>{t.type === "income" ? <Badge className="text-[9px] bg-success/15 text-success">Income</Badge> : <Badge className="text-[9px] bg-destructive/15 text-destructive">Expense</Badge>}</TableCell>
                  <TableCell className="text-xs font-mono">₹{t.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{t.reference || "—"}</TableCell>
                  <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { deleteTransaction(t.id); refreshTxs(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
              {txs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No transactions</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="budgets">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setBgCat(""); setBgAlloc(""); setBgSpent(""); setBgYear(new Date().getFullYear().toString()); setBgOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Budget</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((b) => {
              const pct = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
              return (
                <Card key={b.id}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" />{b.category}</CardTitle></CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <p className="text-muted-foreground">FY {b.fiscal_year}</p>
                    <div className="flex justify-between"><span>Allocated: ₹{b.allocated.toLocaleString()}</span><span>Spent: ₹{b.spent.toLocaleString()}</span></div>
                    <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e" }} /></div><span className="font-mono text-[10px]">{pct}%</span></div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { setBgCat(b.category); setBgAlloc(String(b.allocated)); setBgSpent(String(b.spent)); setBgYear(b.fiscal_year); setBgOpen(true); }}>Edit</Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { deleteBudget(b.id); refreshBudgets(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {budgets.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No budgets</CardContent></Card>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Description</Label><Input value={txDesc} onChange={(e) => setTxDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label><Select value={txType} onValueChange={(v) => setTxType(v as "income"|"expense")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Category</Label><Select value={txCat} onValueChange={setTxCat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Amount (₹)</Label><Input type="number" value={txAmt} onChange={(e) => setTxAmt(e.target.value)} /></div><div><Label className="text-xs">Reference</Label><Input value={txRef} onChange={(e) => setTxRef(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTxOpen(false)}>Cancel</Button><Button onClick={() => { createTransaction({ date: new Date().toISOString(), description: txDesc, category: txCat, type: txType, amount: Number(txAmt) || 0, reference: txRef }); refreshTxs(); setTxOpen(false); toast.success("Added"); }} disabled={!txDesc || !txCat || !txAmt}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bgOpen} onOpenChange={setBgOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Budget</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Category</Label><Select value={bgCat} onValueChange={setBgCat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Allocated (₹)</Label><Input type="number" value={bgAlloc} onChange={(e) => setBgAlloc(e.target.value)} /></div><div><Label className="text-xs">Spent (₹)</Label><Input type="number" value={bgSpent} onChange={(e) => setBgSpent(e.target.value)} /></div></div>
            <div><Label className="text-xs">Fiscal Year</Label><Input value={bgYear} onChange={(e) => setBgYear(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBgOpen(false)}>Cancel</Button><Button onClick={() => { const existing = budgets.find((b) => b.category === bgCat && b.fiscal_year === bgYear); if (existing) { updateBudget(existing.id, { allocated: Number(bgAlloc) || 0, spent: Number(bgSpent) || 0 }); } else { createBudget({ category: bgCat, allocated: Number(bgAlloc) || 0, spent: Number(bgSpent) || 0, fiscal_year: bgYear }); } refreshBudgets(); setBgOpen(false); toast.success("Saved"); }} disabled={!bgCat || !bgAlloc}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
