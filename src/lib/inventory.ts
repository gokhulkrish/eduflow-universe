import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type Item = { id: string; name: string; category: string; quantity: number; min_stock: number; unit: string; location: string; };

const INVENTORY_KEY = "eduflow_inventory";

function ls(): Item[] { try { return JSON.parse(localStorage.getItem(INVENTORY_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Item[]) { localStorage.setItem(INVENTORY_KEY, JSON.stringify(v)); emitAppSync(INVENTORY_KEY); }

export async function getInventory(): Promise<Item[]> {
  const local = ls();
  try {
    if (!(await tableExists("inventory_items"))) return local;
    const { data } = await supabase.from("inventory_items").select("*").order("name");
    if (data && data.length > 0) {
      const mapped: Item[] = data.map((r: any) => ({
        id: r.id, name: r.name, category: r.category ?? "",
        quantity: r.quantity ?? 0, min_stock: r.min_stock ?? 0,
        unit: r.unit ?? "pcs", location: r.location ?? "",
      }));
      ss(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createItem(i: Omit<Item, "id">): Promise<Item> {
  const n: Item = { ...i, id: generateId() };
  try {
    if (await tableExists("inventory_items")) {
      const { data } = await supabase.from("inventory_items").insert({
        name: i.name, category: i.category, quantity: i.quantity,
        min_stock: i.min_stock, unit: i.unit, location: i.location,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls();
  items.unshift(n); ss(items); return n;
}

export async function updateItem(id: string, p: Partial<Item>) {
  try {
    if (await tableExists("inventory_items")) {
      const upd: any = {};
      if (p.name !== undefined) upd.name = p.name;
      if (p.category !== undefined) upd.category = p.category;
      if (p.quantity !== undefined) upd.quantity = p.quantity;
      if (p.min_stock !== undefined) upd.min_stock = p.min_stock;
      if (p.unit !== undefined) upd.unit = p.unit;
      if (p.location !== undefined) upd.location = p.location;
      await supabase.from("inventory_items").update(upd).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls();
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i] = { ...items[i], ...p }; ss(items); }
}

export async function deleteItem(id: string) {
  try {
    if (await tableExists("inventory_items")) {
      await supabase.from("inventory_items").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(ls().filter((x) => x.id !== id));
}
