import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tableExists, type PublicTable } from "@/lib/supabase-health";

export function useDbList<T = any>(
  table: PublicTable,
  options: { order?: { column: string; ascending?: boolean }; select?: string } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (!(await tableExists(table))) {
        setData([]);
        setError(`Missing table "${table}". Apply the Supabase migrations for the connected project.`);
        setLoading(false);
        return;
      }

      const attempt = async (withOrder: boolean) => {
        let q: any = (supabase.from as any)(table).select(options.select || "*");
        if (withOrder && options.order) q = q.order(options.order.column, { ascending: options.order.ascending ?? false });
        return await q;
      };

      let result = await attempt(true);
      if (result.error && options.order) result = await attempt(false);
      if (result.error) setError(result.error.message);
      else { setData((result.data as T[]) || []); setError(null); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setData([]);
    }
    setLoading(false);
  }, [table, options.select, options.order?.column, options.order?.ascending]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload, setData };
}
