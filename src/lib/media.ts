import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type MediaItem = { id: string; name: string; type: string; url: string; size: string; uploaded_at: string; };

export const mediaFilesKey = "eduflow_media";

function ls(): MediaItem[] { try { return JSON.parse(localStorage.getItem(mediaFilesKey) ?? "[]"); } catch { return []; } }
function ss(v: MediaItem[]) { localStorage.setItem(mediaFilesKey, JSON.stringify(v)); emitAppSync(mediaFilesKey); }

export const MEDIA_TYPES = ["image", "video", "audio", "document"];

export async function getMedia(): Promise<MediaItem[]> {
  const local = ls();
  try {
    if (!(await tableExists("media_files"))) return local;
    const { data } = await supabase.from("media_files").select("*").order("uploaded_at", { ascending: false });
    if (data && data.length > 0) {
      const mapped: MediaItem[] = data.map((r: any) => ({
        id: r.id, name: r.name, type: r.type ?? "document",
        url: r.url ?? "", size: r.size ?? "",
        uploaded_at: r.uploaded_at,
      }));
      ss(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function addMedia(m: Omit<MediaItem, "id" | "uploaded_at">): Promise<MediaItem> {
  const n: MediaItem = { ...m, id: generateId(), uploaded_at: new Date().toISOString() };
  try {
    if (await tableExists("media_files")) {
      const { data } = await supabase.from("media_files").insert({
        name: m.name, type: m.type, url: m.url, size: m.size,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls();
  items.unshift(n); ss(items); return n;
}

export async function deleteMedia(id: string) {
  try {
    if (await tableExists("media_files")) {
      await supabase.from("media_files").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(ls().filter((x) => x.id !== id));
}
