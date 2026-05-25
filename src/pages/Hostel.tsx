import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { useDbList } from "@/hooks/useDbList";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

type Room = {
  id: string;
  floor: string | null;
  room_number: string;
  capacity: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function Hostel() {
  const { data: rooms, loading, error } = useDbList<Room>("hostel_rooms");
  const { data: occupancyMap = {} } = useQuery<Record<string, number>>({
    queryKey: ["hostel-occupancy"],
    queryFn: async () => {
      if (!(await tableExists("hostel_allocations"))) return {};
      const { data, error } = await supabase.from("hostel_allocations").select("hostel_room_id,status");
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const roomId = String((row as any).hostel_room_id ?? "");
        if (!roomId) continue;
        if (String((row as any).status ?? "").toLowerCase() !== "active") continue;
        counts[roomId] = (counts[roomId] ?? 0) + 1;
      }
      return counts;
    },
    staleTime: 60_000,
  });

  const displayRooms = useMemo(
    () =>
      [...rooms].sort((a, b) => {
        const floorCompare = String(a.floor ?? "").localeCompare(String(b.floor ?? ""));
        return floorCompare !== 0 ? floorCompare : a.room_number.localeCompare(b.room_number);
      }).map((room) => ({
        ...room,
        occupied: occupancyMap[room.id] ?? 0,
      })),
    [occupancyMap, rooms],
  );

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
      <PageHeader
        title="Hostel Management"
        subtitle={`${displayRooms.length} rooms · ${displayRooms.reduce((s, r) => s + Number(r.capacity ?? 0), 0)} bed capacity`}
        icon={<Building2 className="h-6 w-6" />}
      />
      <DataTable rows={displayRooms} loading={loading} pageSize={10} columns={[
        { key: "floor", header: "Floor", render: (r) => r.floor ?? "—" },
        { key: "room_number", header: "Room", className: "font-mono" },
        { key: "capacity", header: "Capacity" },
        { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
        { key: "occupancy", header: "Occupancy", render: (r) => (
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
