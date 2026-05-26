import { useEffect, useState } from "react";
import { CalendarDays, Plus, Trash2, Users, Ticket, Camera, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { subscribeAppSync } from "@/lib/app-sync";
import { eventsKey, photosKey, rsvpsKey, ticketsKey, getEvents, createEvent, updateEvent, deleteEvent, getRSVPs, addRSVP, getTickets, addTicketType, sellTicket, deleteTicketType, getPhotos, addPhoto, deletePhoto, EVENT_CATEGORIES, getEventAnalytics } from "@/lib/events";

export default function Events() {
  const [tab, setTab] = useState("list");
  const [items, setItems] = useState(() => getEvents());
  const refresh = () => setItems(getEvents());
  const [selId, setSelId] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<any[]>([]); const [tickets, setTickets] = useState<any[]>([]); const [photos, setPhotos] = useState<any[]>([]);
  const loadDetails = (id: string) => { setSelId(id); setRsvps(getRSVPs(id)); setTickets(getTickets(id)); setPhotos(getPhotos(id)); };

  useEffect(() => subscribeAppSync([eventsKey, rsvpsKey, ticketsKey, photosKey], () => {
    refresh();
    if (selId) {
      setRsvps(getRSVPs(selId));
      setTickets(getTickets(selId));
      setPhotos(getPhotos(selId));
    }
  }), [selId]);

  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [loc, setLoc] = useState(""); const [cat, setCat] = useState(""); const [cap, setCap] = useState("");

  const [rsvpOpen, setRsvpOpen] = useState(false); const [rsvpName, setRsvpName] = useState(""); const [rsvpGuests, setRsvpGuests] = useState("1"); const [rsvpStatus, setRsvpStatus] = useState("confirmed");

  const [tixOpen, setTixOpen] = useState(false); const [tixName, setTixName] = useState(""); const [tixPrice, setTixPrice] = useState(""); const [tixQty, setTixQty] = useState("");

  const openEdit = (e?: any) => {
    setEditId(e?.id ?? null); setTitle(e?.title ?? ""); setDesc(e?.description ?? ""); setDate(e?.date?.split("T")[0] ?? ""); setTime(e?.time ?? ""); setLoc(e?.location ?? ""); setCat(e?.category ?? ""); setCap(String(e?.capacity ?? "")); setOpen(true);
  };
  const handleSave = () => {
    const data = { title, description: desc, date: new Date(date).toISOString(), time, location: loc, category: cat, organizer: "Admin", capacity: Number(cap) || 0 };
    if (editId) { updateEvent(editId, data); } else { createEvent(data as any); }
    refresh(); setOpen(false); toast.success(editId ? "Updated" : "Created");
  };

  const categories = [...new Set(EVENT_CATEGORIES)];

  return (
    <div>
      <PageHeader title="Events" subtitle="Plan, RSVP, ticket & gallery" icon={<CalendarDays className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">Events</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => openEdit()}><Plus className="h-4 w-4 mr-1" /> Add Event</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No events scheduled</CardContent></Card>}
            {items.map((e) => (
              <Card key={e.id} className={`border-border/40 ${selId === e.id ? "ring-1 ring-primary" : ""}`} onClick={() => loadDetails(e.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between"><CardTitle className="text-sm">{e.title}</CardTitle><Badge className="text-[9px] bg-muted text-muted-foreground">{e.category}</Badge></div>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <p className="text-muted-foreground line-clamp-1">{e.description}</p>
                  <p><CalendarDays className="h-3 w-3 inline mr-1" />{new Date(e.date).toLocaleDateString()} {e.time ? `at ${e.time}` : ""}</p>
                  {e.location && <p className="text-muted-foreground">📍 {e.location}</p>}
                  {e.capacity > 0 && <p className="text-muted-foreground">Capacity: {e.capacity}</p>}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}>Edit</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                  {selId === e.id && (
                    <div className="mt-2 pt-2 border-t space-y-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={(ev) => { ev.stopPropagation(); setRsvpName(""); setRsvpGuests("1"); setRsvpStatus("confirmed"); setRsvpOpen(true); }}><Users className="h-3 w-3 mr-1" />RSVP</Button>
                        <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={(ev) => { ev.stopPropagation(); setTixName(""); setTixPrice(""); setTixQty(""); setTixOpen(true); }}><Ticket className="h-3 w-3 mr-1" />Ticket</Button>
                      </div>
                      {getEventAnalytics(e.id) && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-1 rounded bg-success/10"><p className="text-[9px] text-muted-foreground">Confirmed</p><p className="text-xs font-bold">{getEventAnalytics(e.id).confirmed}</p></div>
                          <div className="text-center p-1 rounded bg-destructive/10"><p className="text-[9px] text-muted-foreground">Declined</p><p className="text-xs font-bold">{getEventAnalytics(e.id).declined}</p></div>
                          <div className="text-center p-1 rounded bg-warning/10"><p className="text-[9px] text-muted-foreground">Maybe</p><p className="text-xs font-bold">{getEventAnalytics(e.id).maybe}</p></div>
                        </div>
                      )}
                      {tickets.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-muted-foreground">Tickets</p>
                          {tickets.map((t) => (
                            <div key={t.id} className="flex justify-between items-center text-[10px]">
                              <span>{t.name} — ₹{t.price}</span>
                              <span>{t.sold}/{t.quantity} sold</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader><CardTitle className="text-sm">Monthly Calendar</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="font-medium text-muted-foreground p-1">{d}</div>)}
                {Array.from({ length: 31 }, (_, i) => {
                  const dayEvents = items.filter((e) => new Date(e.date).getDate() === i + 1);
                  return (
                    <div key={i} className={`p-1 rounded min-h-[40px] ${dayEvents.length > 0 ? "bg-primary/10 text-primary" : ""}`}>
                      <span className="text-[11px]">{i + 1}</span>
                      {dayEvents.length > 0 && <div className="text-[7px] text-muted-foreground truncate">{dayEvents[0].title}</div>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="eventTitle">Title</Label><Input id="eventTitle" name="eventTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs" htmlFor="eventDesc">Description</Label><Textarea id="eventDesc" name="eventDesc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="eventDate">Date</Label><Input id="eventDate" name="eventDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div><Label className="text-xs" htmlFor="eventTime">Time</Label><Input id="eventTime" name="eventTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" htmlFor="eventLocation">Location</Label><Input id="eventLocation" name="eventLocation" value={loc} onChange={(e) => setLoc(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="eventCategory">Category</Label><Select name="eventCategory" value={cat} onValueChange={setCat}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs" htmlFor="eventCapacity">Capacity</Label><Input id="eventCapacity" name="eventCapacity" type="number" value={cap} onChange={(e) => setCap(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!title || !date}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rsvpOpen} onOpenChange={setRsvpOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>RSVP</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="rsvpName">Guest Name</Label><Input id="rsvpName" name="rsvpName" value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" htmlFor="rsvpStatus">Status</Label><Select name="rsvpStatus" value={rsvpStatus} onValueChange={setRsvpStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="confirmed"><CheckCircle className="h-3 w-3 inline mr-1" />Confirmed</SelectItem><SelectItem value="declined"><XCircle className="h-3 w-3 inline mr-1" />Declined</SelectItem><SelectItem value="maybe">Maybe</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs" htmlFor="rsvpGuests">Guests</Label><Input id="rsvpGuests" name="rsvpGuests" type="number" value={rsvpGuests} onChange={(e) => setRsvpGuests(e.target.value)} min="1" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRsvpOpen(false)}>Cancel</Button><Button disabled={!rsvpName} onClick={() => { if (selId) { addRSVP({ event_id: selId, guest: rsvpName, status: rsvpStatus, guests_count: Number(rsvpGuests), notes: "" }); setRsvps(getRSVPs(selId)); setRsvpOpen(false); toast.success("RSVP added"); } }}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tixOpen} onOpenChange={setTixOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Ticket Type</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="tixName">Ticket Name</Label><Input id="tixName" name="tixName" value={tixName} onChange={(e) => setTixName(e.target.value)} placeholder="e.g. VIP" /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="tixPrice">Price (₹)</Label><Input id="tixPrice" name="tixPrice" type="number" value={tixPrice} onChange={(e) => setTixPrice(e.target.value)} /></div><div><Label className="text-xs" htmlFor="tixQty">Quantity</Label><Input id="tixQty" name="tixQty" type="number" value={tixQty} onChange={(e) => setTixQty(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTixOpen(false)}>Cancel</Button><Button disabled={!tixName || !tixQty} onClick={() => { if (selId) { addTicketType({ event_id: selId, name: tixName, price: Number(tixPrice) || 0, quantity: Number(tixQty), sold: 0 }); setTickets(getTickets(selId)); setTixOpen(false); toast.success("Ticket added"); } }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
