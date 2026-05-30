import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRealtime(tableName: string, onEvent: () => void) {
  const savedCallback = useRef(onEvent);
  savedCallback.current = onEvent;

  useEffect(() => {
    const channel = supabase.channel(`${tableName}-live`);

    if (typeof channel?.on !== "function") return;

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => savedCallback.current?.()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);
}
