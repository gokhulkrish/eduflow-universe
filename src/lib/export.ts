import { toCsv, downloadFile } from "./reports";

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: string; label: string }[]
) {
  const rows = columns
    ? data.map(item => {
        const row: Record<string, any> = {};
        columns.forEach(col => { row[col.label] = item[col.key] ?? ""; });
        return row;
      })
    : data.map(item => {
        const { id, created_at, ...rest } = item;
        return rest;
      });
  downloadFile(toCsv(rows), `${filename}.csv`, "text/csv");
}
