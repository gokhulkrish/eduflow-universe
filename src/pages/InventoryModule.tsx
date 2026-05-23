import { useEffect, useState } from "react";
import { Package, Plus, Trash2, Minus, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

type Item = { id: string; name: string; category: string; quantity: number; min_stock: number; unit: string; location: string; };
const INVENTORY_KEY = "eduflow_inventory";
function ls(): Item[] { try { return JSON.parse(localStorage.getItem(INVENTORY_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Item[]) { localStorage.setItem(INVENTORY_KEY, JSON.stringify(v)); emitAppSync(INVENTORY_KEY); }

export default function InventoryModule() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [cat, setCat] = useState(""); const [qty, setQty] = useState(""); const [minStock, setMinStock] = useState(""); const [unit, setUnit] = useState(""); const [loc, setLoc] = useState("");
  const filtered = items.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([INVENTORY_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Inventory Module" subtitle="Track assets & stock levels" icon={<Package className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Quantity</p><p className="text-2xl font-bold">{items.reduce((s, i) => s + i.quantity, 0)}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Low Stock</p><p className="text-2xl font-bold text-destructive">{items.filter((i) => i.quantity <= i.min_stock).length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Categories</p><p className="text-2xl font-bold">{new Set(items.map((i) => i.category)).size}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setCat(""); setQty(""); setMinStock(""); setUnit(""); setLoc(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">Item</TableHead><TableHead className="text-xs">Category</TableHead><TableHead className="text-xs">Quantity</TableHead><TableHead className="text-xs">Min Stock</TableHead><TableHead className="text-xs">Unit</TableHead><TableHead className="text-xs">Location</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((i) => {
            const low = i.quantity <= i.min_stock;
            return (
              <TableRow key={i.id}>
                <TableCell className="text-xs font-medium">{i.name}</TableCell>
                <TableCell className="text-xs">{i.category}</TableCell>
                <TableCell className={`text-xs font-bold ${low ? "text-destructive" : ""}`}>{i.quantity}</TableCell>
                <TableCell className="text-xs">{i.min_stock}</TableCell>
                <TableCell className="text-xs">{i.unit}</TableCell>
                <TableCell className="text-xs">{i.location}</TableCell>
                <TableCell>{low ? <Badge className="text-[9px] bg-destructive/15 text-destructive">Low Stock</Badge> : <Badge className="text-[9px] bg-success/15 text-success">In Stock</Badge>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="rounded-lg h-6 w-6 p-0" onClick={() => { ss(ls().map((x) => x.id === i.id ? { ...x, quantity: x.quantity + 1 } : x)); refresh(); }}><PlusCircle className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-6 w-6 p-0" onClick={() => { if (i.quantity > 0) { ss(ls().map((x) => x.id === i.id ? { ...x, quantity: Math.max(0, x.quantity - 1) } : x)); refresh(); } }}><Minus className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-6 w-6 p-0 text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== i.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching items" : "No items in inventory"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Item Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label className="text-xs">Category</Label><Input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="e.g. Stationery" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Quantity</Label><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></div><div><Label className="text-xs">Min Stock</Label><Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. pcs, kg" /></div><div><Label className="text-xs">Location</Label><Input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. Store Room A" /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !cat} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), name, category: cat, quantity: Number(qty) || 0, min_stock: Number(minStock) || 5, unit, location: loc }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
