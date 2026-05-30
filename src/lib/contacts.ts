import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type Contact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  department: string;
};

export const contactsKey = "eduflow_contacts";

function hydrate(row: any): Contact {
  return { id: row.id, name: row.name ?? "", role: row.role ?? "", phone: row.phone ?? "", email: row.email ?? "", department: row.department ?? "" };
}

function loadFallback(): Contact[] {
  try { return JSON.parse(localStorage.getItem(contactsKey) ?? "[]"); } catch { return []; }
}

function saveFallback(items: Contact[]) {
  localStorage.setItem(contactsKey, JSON.stringify(items));
}

export async function getContacts(): Promise<Contact[]> {
  if (await tableExists("contacts")) {
    const { data } = await supabase.from("contacts").select("*").order("name");
    return (data ?? []).map(hydrate);
  }
  return loadFallback();
}

export async function createContact(input: Omit<Contact, "id">): Promise<Contact> {
  if (await tableExists("contacts")) {
    const { data } = await supabase.from("contacts").insert(input).select().single();
    return hydrate(data);
  }
  const item: Contact = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  const items = loadFallback();
  items.push(item);
  saveFallback(items);
  return item;
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<void> {
  if (await tableExists("contacts")) {
    await supabase.from("contacts").update(updates).eq("id", id);
    return;
  }
  const items = loadFallback();
  const idx = items.findIndex((c) => c.id === id);
  if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; saveFallback(items); }
}

export async function deleteContact(id: string): Promise<void> {
  if (await tableExists("contacts")) {
    await supabase.from("contacts").delete().eq("id", id);
    return;
  }
  saveFallback(loadFallback().filter((c) => c.id !== id));
}
