import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";

type HostelRoomRow = Database["public"]["Tables"]["hostel_rooms"]["Row"];
type Room = {
  id: string;
  block: string;
  room_no: string;
  capacity: number;
  occupied: number;
  status: string;
};

export default function Hostel() {
  const [data, setData] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [roomsResponse, allocationsResponse] = await Promise.all([
          supabase.from("hostel_rooms").select("id, floor, room_number, capacity, status").order("room_number", { ascending: true }),
          supabase.from("hostel_allocations").select("hostel_room_id"),
        ]);

        if (roomsResponse.error) throw roomsResponse.error;
        if (allocationsResponse.error) throw allocationsResponse.error;

        const occupiedByRoom = new Map<string, number>();
        for (const allocation of allocationsResponse.data ?? []) {
          occupiedByRoom.set(allocation.hostel_room_id, (occupiedByRoom.get(allocation.hostel_room_id) ?? 0) + 1);
        }

        const rooms = ((roomsResponse.data ?? []) as HostelRoomRow[]).map((room) => ({
          id: room.id,
          block: room.floor ?? "Unassigned",
          room_no: room.room_number,
          capacity: room.capacity,
          occupied: occupiedByRoom.get(room.id) ?? 0,
          status: String(room.status ?? "active"),
        }));

        if (!cancelled) {
          setData(rooms);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setData([]);
          setError(loadError instanceof Error ? loadError.message : "Failed to load hostel rooms");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

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
        { key: "status", header: "Status", render: r => <Badge variant="secondary">{r.status}</Badge> },
        { key: "occupancy", header: "Occupancy", render: r => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${(r.occupied/r.capacity)*100}%` }} />
            </div>
            <span className="text-xs">{r.occupied}/{r.capacity}</span>
          </div>
        ) },
      ]} />
    </div>
  );
}
