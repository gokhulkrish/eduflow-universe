import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";

interface Note {
  id: string;
  studentId: string;
  type: string;
  content: string;
  createdAt: string;
  author: string;
}

const NOTE_TYPES = [
  { key: "internal-note", label: "Internal Note", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { key: "counselor-note", label: "Counselor Note", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { key: "principal-note", label: "Principal Note", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { key: "parent-request", label: "Parent Request", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
];

const STORAGE_KEY = "sms.student-notes.v1";

function loadNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

interface Props { studentId: string; }

export default function NotesSection({ studentId }: Props) {
  const location = useLocation();
  const activeType = location.pathname.split("/notes/")[1] || "internal-note";
  const [notes, setNotes] = useState<Note[]>([]);
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    setNotes(loadNotes().filter((n) => n.studentId === studentId));
  }, [studentId]);

  const filtered = useMemo(() => notes.filter((n) => n.type === activeType), [notes, activeType]);
  const typeDef = NOTE_TYPES.find((t) => t.key === activeType);

  const addNote = () => {
    if (!newContent.trim()) return;
    const note: Note = {
      id: generateId(),
      studentId,
      type: activeType,
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
      author: "Current User",
    };
    const all = loadNotes();
    all.push(note);
    saveNotes(all);
    setNotes(all.filter((n) => n.studentId === studentId));
    setNewContent("");
    toast.success(`${typeDef?.label ?? "Note"} added`);
  };

  const deleteNote = (id: string) => {
    const all = loadNotes().filter((n) => n.id !== id);
    saveNotes(all);
    setNotes(all.filter((n) => n.studentId === studentId));
    toast.success("Note deleted");
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">{typeDef?.label ?? "Notes"}</CardTitle>
            </div>
            <Badge variant="secondary" className="text-[10px]">{filtered.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={`Add a ${typeDef?.label?.toLowerCase() ?? "note"}...`}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
          />
          <Button onClick={addNote} disabled={!newContent.trim()} size="sm" className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Add Note
          </Button>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No {typeDef?.label?.toLowerCase() ?? "notes"} yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {[...filtered].reverse().map((note) => (
            <Card key={note.id} className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{note.author}</span>
                      <span>·</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => deleteNote(note.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
