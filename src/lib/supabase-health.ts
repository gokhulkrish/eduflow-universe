import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { isMissingSupabaseTableError } from "@/lib/supabase-query";

export type PublicTable = keyof Database["public"]["Tables"];

const TABLE_CACHE = new Map<PublicTable, boolean>();
const TABLE_PROBES = new Map<PublicTable, Promise<boolean>>();

export async function tableExists(table: PublicTable): Promise<boolean> {
  const cached = TABLE_CACHE.get(table);
  if (cached !== undefined) return cached;

  const pending = TABLE_PROBES.get(table);
  if (pending) return pending;

  const probe = (async () => {
    const { error } = await supabase.from(table).select("id", { head: true });
    if (!error) return true;
    if (isMissingSupabaseTableError(error)) return false;
    throw error;
  })();

  TABLE_PROBES.set(table, probe);

  try {
    const exists = await probe;
    TABLE_CACHE.set(table, exists);
    return exists;
  } finally {
    TABLE_PROBES.delete(table);
  }
}

export async function tablesExist(tables: PublicTable[]): Promise<boolean> {
  const results = await Promise.all(tables.map((table) => tableExists(table)));
  return results.every(Boolean);
}
