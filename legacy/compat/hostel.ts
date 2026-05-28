export type LegacyHostelRoom = {
  id: string;
  block: string;
  roomNo: string;
  capacity: number;
  occupied: number;
  roomType: string;
};

export type LegacyHostelFilter = {
  block?: string;
  roomType?: string;
};

export async function listHostelRoomsLegacy(filter: LegacyHostelFilter = {}): Promise<LegacyHostelRoom[]> {
  const { supabase } = await import("../../src/integrations/supabase/client");
  let q = supabase.from("hostel_rooms" as never).select("*");
  if (filter.block) q = (q as any).eq("block", filter.block);
  if (filter.roomType) q = (q as any).eq("room_type", filter.roomType);
  q = (q as any).order("block", { ascending: true });

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    block: String(r.block ?? ""),
    roomNo: String(r.room_no ?? ""),
    capacity: Number(r.capacity ?? 0),
    occupied: Number(r.occupied ?? 0),
    roomType: String(r.room_type ?? ""),
  }));
}
