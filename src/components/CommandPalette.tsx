import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { performGlobalSearch } from "@/lib/global-search";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const results = performGlobalSearch(query);

  const execute = useCallback((url?: string) => {
    if (url) navigate(url);
    setOpen(false);
    setQuery("");
  }, [navigate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-4 w-[calc(100vw-1rem)] max-w-xl translate-y-0 sm:top-[15%] sm:w-full">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            className="pl-9 h-11 text-sm border-0 shadow-none focus-visible:ring-0"
            placeholder="Search modules, pages, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results.length > 0) execute(results[0].url);
            }}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded border bg-muted px-1.5 text-[10px] text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
        {query && (
          <div className="mt-2 max-h-72 overflow-y-auto space-y-0.5">
            {results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No results found</p>
            )}
            {results.map((r, i) => (
              <button
                key={`${r.url}-${i}`}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                onClick={() => execute(r.url)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{highlightMatch(r.title, query)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.section}</p>
                </div>
                <span className="shrink-0 text-[10px] uppercase text-muted-foreground">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const terms = query.split(/\s+/).filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!terms.length) return text;
  const regex = new RegExp(`(${terms.join("|")})`, "gi");
  return text.replace(regex, "<mark class='bg-primary/20 text-primary rounded px-0.5'>$1</mark>");
}
