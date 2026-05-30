import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type Alumni = { id: string; name: string; batch: string; email: string; phone: string; occupation: string; company: string; city: string; };

const ALUMNI_KEY = "eduflow_alumni";

function ls(): Alumni[] { try { return JSON.parse(localStorage.getItem(ALUMNI_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Alumni[]) { localStorage.setItem(ALUMNI_KEY, JSON.stringify(v)); emitAppSync(ALUMNI_KEY); }

export async function getAlumni(): Promise<Alumni[]> {
  const local = ls();
  try {
    if (!(await tableExists("alumni"))) return local;
    const { data } = await supabase.from("alumni").select("*").order("name");
    if (data && data.length > 0) {
      const mapped: Alumni[] = data.map((r: any) => ({
        id: r.id, name: r.name, batch: r.batch ?? "",
        email: r.email ?? "", phone: r.phone ?? "",
        occupation: r.occupation ?? "", company: r.company ?? "",
        city: r.city ?? "",
      }));
      ss(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createAlumni(a: Omit<Alumni, "id">): Promise<Alumni> {
  const n: Alumni = { ...a, id: generateId() };
  try {
    if (await tableExists("alumni")) {
      const { data } = await supabase.from("alumni").insert({
        name: a.name, batch: a.batch, email: a.email, phone: a.phone,
        occupation: a.occupation, company: a.company, city: a.city,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls();
  items.unshift(n); ss(items); return n;
}

export async function deleteAlumni(id: string) {
  try {
    if (await tableExists("alumni")) {
      await supabase.from("alumni").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(ls().filter((x) => x.id !== id));
}
