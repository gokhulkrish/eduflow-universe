import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { FileImage, Plus, Trash2, File, Video, Music } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { generateId } from "@/lib/utils";

type MediaItem = { id: string; name: string; type: string; url: string; size: string; uploaded_at: string; };
export const mediaFilesKey = "eduflow_media";
function ls(): MediaItem[] { try { return JSON.parse(localStorage.getItem(mediaFilesKey) ?? "[]"); } catch { return []; } }
function ss(v: MediaItem[]) { localStorage.setItem(mediaFilesKey, JSON.stringify(v)); emitAppSync(mediaFilesKey); }

const icons: Record<string, any> = { image: FileImage, video: Video, audio: Music, document: File };

export default function MediaFileManagement() {
  const [items, setItems] = useState(ls()); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [type, setType] = useState("document"); const [url, setUrl] = useState(""); const [size, setSize] = useState("");

  useEffect(() => subscribeAppSync([mediaFilesKey], refresh), []);

  return (
    <div>
      <PageHeader title="Media File Management" subtitle="Upload & organize media assets" icon={<FileImage className="h-6 w-6" />} />
      <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setType("document"); setUrl(""); setSize(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Media</Button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => {
          const Icon = icons[m.type] || File;
          return (
            <Card key={m.id} className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><Icon className="h-5 w-5 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.type} · {m.size || "—"}</p>
                    <p className="text-[9px] text-muted-foreground">{new Date(m.uploaded_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== m.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No media files uploaded</CardContent></Card>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Media</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="mediaFileName">File Name</Label><Input id="mediaFileName" name="mediaFileName" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="mediaType">Type</Label><Select name="mediaType" value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="image">Image</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="audio">Audio</SelectItem><SelectItem value="document">Document</SelectItem></SelectContent></Select></div><div><Label className="text-xs" htmlFor="mediaSize">Size</Label><Input id="mediaSize" name="mediaSize" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 2.4 MB" /></div></div>
            <div><Label className="text-xs" htmlFor="mediaUrl">URL</Label><Input id="mediaUrl" name="mediaUrl" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !url} onClick={() => { const items = ls(); items.push({ id: generateId(), name, type, url, size, uploaded_at: new Date().toISOString() }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
