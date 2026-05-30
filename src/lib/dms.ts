import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type DmsDocument = { id: string; documentTitle: string; documentType: string; owner: string; expiryDate: string; documentStatus: string; };
export const DMS_KEY = "eduflow_dms";
function h(r: any): DmsDocument { return { id: r.id, documentTitle: r.document_title ?? "", documentType: r.document_type ?? "", owner: r.owner ?? "", expiryDate: r.expiry_date ?? "", documentStatus: r.document_status ?? "Draft" }; }
function toDb(i: Omit<DmsDocument, "id">) { return { document_title: i.documentTitle, document_type: i.documentType, owner: i.owner, expiry_date: i.expiryDate, document_status: i.documentStatus }; }
function lf(): DmsDocument[] { try { return JSON.parse(localStorage.getItem(DMS_KEY) ?? "[]"); } catch { return []; } }
function sf(v: DmsDocument[]) { localStorage.setItem(DMS_KEY, JSON.stringify(v)); }
export async function getDocuments(): Promise<DmsDocument[]> {
  if (await tableExists("documents")) { const { data } = await supabase.from("documents").select("*").order("document_title"); return (data ?? []).map(h); }
  return lf();
}
export async function createDocument(i: Omit<DmsDocument, "id">): Promise<DmsDocument> {
  if (await tableExists("documents")) { const { data } = await supabase.from("documents").insert(toDb(i)).select().single(); return h(data); }
  const item: DmsDocument = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i }; const items = lf(); items.push(item); sf(items); return item;
}
export async function updateDocument(id: string, updates: Partial<DmsDocument>): Promise<void> {
  if (await tableExists("documents")) {
    const db: any = {};
    if (updates.documentTitle !== undefined) db.document_title = updates.documentTitle;
    if (updates.documentType !== undefined) db.document_type = updates.documentType;
    if (updates.owner !== undefined) db.owner = updates.owner;
    if (updates.expiryDate !== undefined) db.expiry_date = updates.expiryDate;
    if (updates.documentStatus !== undefined) db.document_status = updates.documentStatus;
    await supabase.from("documents").update(db).eq("id", id);
    return;
  }
  const items = lf(); const idx = items.findIndex((d) => d.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteDocument(id: string): Promise<void> {
  if (await tableExists("documents")) { await supabase.from("documents").delete().eq("id", id); return; }
  sf(lf().filter((d) => d.id !== id));
}
