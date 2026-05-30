import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Command, ArrowUp, ArrowDown, Hash, FileText, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { performGlobalSearch, type SearchResult } from "@/lib/global-search";
import { useHotkey } from "@/hooks/useHotkey";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useHotkey(["ctrl+k", "meta+k"], (e) => {
    e.preventDefault();
    setOpen((prev) => !prev);
  });

  useHotkey("escape", () => {
    if (open) setOpen(false);
  });

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener("open-command-palette", handler);
    return () => document.removeEventListener("open-command-palette", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await performGlobalSearch(query);
      setResults(res);
      setSelectedIndex(0);
      setLoading(false);
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const execute = useCallback((url?: string) => {
    if (url) navigate(url);
    setOpen(false);
    setQuery("");
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((prev) => Math.max(prev - 1, 0)); }
    if (e.key === "Enter" && results[selectedIndex]) { execute(results[selectedIndex].url); }
  }, [results, selectedIndex, execute]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const cat = r.category ?? "Results";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  const categoryIcon = (cat: string) => {
    if (cat === "Home" || cat === "Modules") return <Layers className="h-3 w-3" />;
    if (cat === "Import" || cat === "Tools" || cat === "Settings") return <Hash className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-4 w-[calc(100vw-1rem)] max-w-xl translate-y-0 sm:top-[15%] sm:w-full" onKeyDown={handleKeyDown}>
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="command-palette-search"
            name="commandPaletteSearch"
            ref={inputRef}
            className="pl-9 h-11 text-sm border-0 shadow-none focus-visible:ring-0"
            placeholder="Search modules, pages, features, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <Command className="h-3 w-3" />K
            <span className="mx-0.5 text-[8px] text-muted-foreground/50">|</span>
            <ArrowUp className="h-2.5 w-2.5" /><ArrowDown className="h-2.5 w-2.5" />
            <span className="mx-0.5 text-[8px] text-muted-foreground/50">|</span>
            ↵
          </kbd>
        </div>
        {loading && query.trim() && (
          <div className="mt-2 flex items-center justify-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {!loading && query && results.length === 0 && (
          <div className="mt-2 flex flex-col items-center py-6 text-sm text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-30" />
            <p>No results for &ldquo;{query}&rdquo;</p>
            <p className="text-xs">Try a different search term</p>
          </div>
        )}
        {!loading && query && results.length > 0 && (
          <div ref={listRef} className="mt-2 max-h-80 overflow-y-auto space-y-1.5">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {categoryIcon(cat)} {cat}
                </div>
                {items.map((r, i) => {
                  const globalIndex = results.indexOf(r);
                  return (
                    <button
                      key={`${r.url}-${globalIndex}`}
                      data-index={globalIndex}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${globalIndex === selectedIndex ? "bg-accent" : "hover:bg-accent/50"}`}
                      onClick={() => execute(r.url)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{highlightMatch(r.title, query)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{r.section}</p>
                      </div>
                      {r.type && (
                        <span className="shrink-0 rounded border bg-muted/50 px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground">{r.type}</span>
                      )}
                    </button>
                  );
                })}
              </div>
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
