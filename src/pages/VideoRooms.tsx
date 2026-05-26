import { useState } from "react";
import { Video, Plus, Trash2, Users, Clock, Copy, CalendarDays, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { generateId } from "@/lib/utils";

interface Room {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  host: string;
  participants: string[];
  status: "scheduled" | "live" | "ended";
}

const STORAGE_KEY = "sms.videorooms.v1";

function load(): Room[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function save(rooms: Room[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms)); }

export default function VideoRooms() {
  const [tab, setTab] = useState("scheduled");
  const [rooms, setRooms] = useState(load);
  const refresh = () => setRooms(load());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [duration, setDuration] = useState("30");

  const handleCreate = () => {
    if (!title || !date || !time) { toast.error("Fill all fields"); return; }
    const all = load();
    all.push({ id: generateId(), title, date, time, duration: Number(duration), host: "Current User", participants: [], status: "scheduled" });
    save(all); refresh(); setOpen(false); setTitle(""); setDate(""); setTime(""); setDuration("30"); toast.success("Room created");
  };

  const startRoom = (id: string) => {
    const all = load().map((r) => r.id === id ? { ...r, status: "live" as const } : r);
    save(all); refresh(); toast.success("Room started");
  };

  const endRoom = (id: string) => {
    const all = load().map((r) => r.id === id ? { ...r, status: "ended" as const } : r);
    save(all); refresh(); toast.success("Room ended");
  };

  const deleteRoom = (id: string) => {
    const all = load().filter((r) => r.id !== id);
    save(all); refresh(); toast.success("Deleted");
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/video-rooms?join=${id}`);
    toast.success("Link copied");
  };

  const filtered = tab === "all" ? rooms : rooms.filter((r) => r.status === tab);

  return (
    <div>
      <PageHeader title="Video Rooms" subtitle="Schedule & manage virtual classrooms" icon={<Video className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="ended">Ended</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Schedule Room</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No video rooms</CardContent></Card>}
            {filtered.map((r) => (
              <Card key={r.id} className="border-border/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{r.title}</CardTitle>
                    <Badge className={`text-[9px] ${r.status === "live" ? "bg-success/15 text-success" : r.status === "ended" ? "bg-muted text-muted-foreground" : "bg-warning/15 text-warning"}`}>{r.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <p><CalendarDays className="h-3 w-3 inline mr-1" />{new Date(date + "T" + time).toLocaleString()}</p>
                  <p><Clock className="h-3 w-3 inline mr-1" />{r.duration} min</p>
                  <p><Users className="h-3 w-3 inline mr-1" />Host: {r.host}</p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => copyLink(r.id)}><Copy className="h-3 w-3 mr-1" />Copy Link</Button>
                    {r.status === "scheduled" && <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => startRoom(r.id)}><Video className="h-3 w-3 mr-1" />Start</Button>}
                    {r.status === "live" && <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => endRoom(r.id)}><XCircle className="h-3 w-3 mr-1" />End</Button>}
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => deleteRoom(r.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Schedule Video Room</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label htmlFor="roomTitle">Title</Label><Input id="roomTitle" name="roomTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Room title" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="roomDate">Date</Label><Input id="roomDate" name="roomDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label htmlFor="roomTime">Time</Label><Input id="roomTime" name="roomTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            </div>
            <div><Label htmlFor="roomDuration">Duration (min)</Label><Select name="roomDuration" value={String(duration)} onValueChange={setDuration}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">15 min</SelectItem><SelectItem value="30">30 min</SelectItem><SelectItem value="45">45 min</SelectItem><SelectItem value="60">60 min</SelectItem><SelectItem value="90">90 min</SelectItem><SelectItem value="120">120 min</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="mt-2"><Button className="rounded-xl bg-gradient-primary shadow-glow" onClick={handleCreate}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
