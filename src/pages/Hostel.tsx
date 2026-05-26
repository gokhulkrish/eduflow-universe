import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

type Room = { id: string; block: string; room_no: string; capacity: number; occupied: number; room_type: string };

export default function Hostel() {
  const { data, loading, error } = useDbList<Room>("hostel_rooms", { order: { column: "block", ascending: true } });
  if (error) {
    return (
      <div>
        <PageHeader title="Hostel Management" subtitle="Could not load data" icon={<Building2 className="h-6 w-6" />} />
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Hostel Management" subtitle={`${data.length} rooms · ${data.reduce((s,r)=>s+r.capacity,0)} bed capacity`} icon={<Building2 className="h-6 w-6" />} />
      <DataTable rows={data} loading={loading} pageSize={10} columns={[
        { key: "block", header: "Block" },
        { key: "room_no", header: "Room", className: "font-mono" },
        { key: "room_type", header: "Type", render: r => <Badge variant="secondary">{r.room_type}</Badge> },
        { key: "occupancy", header: "Occupancy", render: r => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${Math.min(100, Math.round((Number(r.occupied ?? 0) / Math.max(1, Number(r.capacity ?? 0))) * 100))}%` }} />
            </div>
            <span className="text-xs">{r.occupied}/{r.capacity}</span>
          </div>
        ) },
      ]} />
    </div>
  );
}
