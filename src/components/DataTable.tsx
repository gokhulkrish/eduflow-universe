import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

export type Column<T> = { key: keyof T | string; header: string; render?: (row: T) => ReactNode; className?: string };

export function DataTable<T extends { id: string }>({ rows, columns, loading, empty = "No records", pageSize }: {
  rows: T[]; columns: Column<T>[]; loading?: boolean; empty?: string; pageSize?: number;
}) {
  const pag = usePagination({ data: rows, pageSize: pageSize ?? 10 });
  const displayRows = pageSize ? pag.pageData : rows;

  return (
    <Card className="glass p-4">
      {pageSize && <TablePagination {...pag} />}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              {columns.map((c) => <th key={String(c.key)} className={`py-3 ${c.className ?? ""}`}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={columns.length} className="py-12 text-center text-muted-foreground">Loading…</td></tr>}
            {!loading && displayRows.map((r, i) => (
              <tr key={r.id} className="border-b border-border/40 hover:bg-secondary/40 animate-fade-in" style={{ animationDelay: `${i * 25}ms` }}>
                {columns.map((c) => (
                  <td key={String(c.key)} className={`py-3 ${c.className ?? ""}`}>
                    {c.render ? c.render(r) : (r as any)[c.key as any] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={columns.length} className="py-12 text-center text-muted-foreground">{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
