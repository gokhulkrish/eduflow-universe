import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type Visitor = { id: string; name: string; contact: string; purpose: string; host: string; in_time: string; out_time: string; status: string; };

export const visitorsKey = "eduflow_visitors";

function ls(): Visitor[] { try { return JSON.parse(localStorage.getItem(visitorsKey) ?? "[]"); } catch { return []; } }
function ss(v: Visitor[]) { localStorage.setItem(visitorsKey, JSON.stringify(v)); emitAppSync(visitorsKey); }

export async function getVisitors(): Promise<Visitor[]> {
  const local = ls();
  try {
    if (!(await tableExists("visitors"))) return local;
    const { data } = await supabase.from("visitors").select("*").order("in_time", { ascending: false });
    if (data && data.length > 0) {
      const mapped: Visitor[] = data.map((r: any) => ({
        id: r.id, name: r.name, contact: r.contact ?? "",
        purpose: r.purpose ?? "", host: r.host ?? "",
        in_time: r.in_time, out_time: r.out_time ?? "",
        status: r.status ?? "checked-in",
      }));
      ss(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function checkInVisitor(v: Omit<Visitor, "id" | "in_time" | "out_time" | "status">): Promise<Visitor> {
  const n: Visitor = { ...v, id: generateId(), in_time: new Date().toISOString(), out_time: "", status: "checked-in" };
  try {
    if (await tableExists("visitors")) {
      const { data } = await supabase.from("visitors").insert({
        name: v.name, contact: v.contact, purpose: v.purpose, host: v.host,
        status: "checked-in",
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls();
  items.unshift(n); ss(items); return n;
}

export async function checkOutVisitor(id: string) {
  try {
    if (await tableExists("visitors")) {
      await supabase.from("visitors").update({ status: "checked-out", out_time: new Date().toISOString() }).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls();
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i].status = "checked-out"; items[i].out_time = new Date().toISOString(); ss(items); }
}
