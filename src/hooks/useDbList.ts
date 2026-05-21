import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDbList<T = any>(
  table: string,
  options: { order?: { column: string; ascending?: boolean }; select?: string } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    let q: any = (supabase.from as any)(table).select(options.select || "*");
    if (options.order) q = q.order(options.order.column, { ascending: options.order.ascending ?? false });
    const { data: rows, error } = await q;
    if (error) setError(error.message);
    else { setData((rows as T[]) || []); setError(null); }
    setLoading(false);
  }, [table, options.select, options.order?.column, options.order?.ascending]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload, setData };
}
