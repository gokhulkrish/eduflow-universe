import { useMemo } from "react";

export function TablePagination({ page, totalPages, total, from, to, setPage, next, prev, pageSize, setPageSize }: {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  setPage: (p: number) => void;
  next: () => void;
  prev: () => void;
  pageSize: number;
  setPageSize?: (size: number) => void;
}) {
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [0];
    if (totalPages <= 7) {
      for (let i = 1; i < totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, page - 1);
      const end = Math.min(totalPages - 2, page + 1);
      if (start > 1) pages.push("ellipsis");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages - 1);
    }
    return pages;
  }, [page, totalPages]);

  const pageSizeOptions = useMemo(() => {
    const base = [10, 25, 50, 100];
    const opts = base.filter((s) => s < total);
    for (let s = 250; s < total; s += 250) {
      opts.push(s);
    }
    if (!opts.includes(total) && total > 0) opts.push(total);
    return opts;
  }, [total]);

  if (totalPages <= 1 && total <= pageSize) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-background/90 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize?.(Number(e.target.value))}
          className="h-7 rounded-md border border-border/40 bg-background px-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-primary/30"
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>
              {s === total ? `All (${total.toLocaleString()})` : s}
            </option>
          ))}
        </select>
      </div>

      <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
        {from}–{to}
        <span className="max-sm:hidden"> of {total.toLocaleString()}</span>
      </span>

      <div className="flex items-center gap-0.5">
        <button onClick={prev} disabled={page === 0}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-sm text-muted-foreground hover:bg-accent disabled:opacity-30 transition-colors"
          aria-label="Previous page"
        >‹</button>
        {pageNumbers.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e${i}`} className="inline-flex h-7 w-4 items-center justify-center text-[10px] text-muted-foreground">…</span>
          ) : (
            <button key={p} onClick={() => setPage(p)}
              className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded px-1 text-xs font-medium transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >{p + 1}</button>
          )
        )}
        <button onClick={next} disabled={page >= totalPages - 1}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-sm text-muted-foreground hover:bg-accent disabled:opacity-30 transition-colors"
          aria-label="Next page"
        >›</button>
      </div>
    </div>
  );
}
