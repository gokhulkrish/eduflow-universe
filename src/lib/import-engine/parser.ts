import type { ParsedImportFile } from "./types";
import { maybeTrim } from "./core";

export function detectCSVDelimiter(text: string): string {
  const firstLines = text.split("\n").slice(0, 5).join("\n");
  const delimiters = [",", ";", "\t"];
  let bestDelimiter = ",";
  let maxCount = 0;

  for (const delim of delimiters) {
    let count = 0;
    let inQuotes = false;
    for (const char of firstLines) {
      if (char === '"') inQuotes = !inQuotes;
      if (char === delim && !inQuotes) count++;
    }
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
}

export function parseCSV(
  text: string,
  options: { delimiter?: string; rawRows?: boolean } = {},
) {
  const delimiter = options.delimiter || detectCSVDelimiter(text);
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      current.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      current.push(field);
      rows.push(current);
      current = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length || current.length) {
    current.push(field);
    rows.push(current);
  }

  if (!rows.length) return [];

  const headers = rows[0]
    .map((x) => String(x ?? "").trim())
    .filter((x) => x.length > 0);

  if (headers.length === 0) {
    const colCount = rows[0].length;
    for (let i = 0; i < colCount; i++) {
      headers.push(`Column_${i + 1}`);
    }
  }

  const dataRows = rows
    .slice(1)
    .filter((r) => r.some((v) => String(v ?? "").trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] ?? "";
      });
      return obj;
    });

  if (options.rawRows) {
    return { headers, rows: dataRows, rawRows: rows };
  }

  return dataRows;
}

export async function parseSpreadsheetFile(
  file: File,
): Promise<Record<string, string>[]> {
  if (!file) {
    throw new Error("No spreadsheet file selected.");
  }

  let XLSX: typeof import("xlsx");
  try {
    XLSX = await import("xlsx");
  } catch {
    throw new Error(
      "XLSX library not loaded. Install with: npm install xlsx",
    );
  }

  const arrayBuffer = await file.arrayBuffer();

  try {
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true, raw: false });
    const firstSheet = workbook.SheetNames?.[0];

    if (!firstSheet) {
      throw new Error("Workbook has no readable sheets.");
    }

    const sheet = workbook.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: "",
      raw: false,
    });

    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    throw new Error(
      `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export function extractImportHeadersFromRows(
  rows: Record<string, string>[],
): string[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  const firstRow = rows[0];
  if (typeof firstRow === "object" && firstRow !== null) {
    return Object.keys(firstRow);
  }
  return [];
}

export async function parseImportFile(
  file: File,
  options: { csvDelimiter?: string } = {},
): Promise<ParsedImportFile> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const sourceType =
    extension === "csv"
      ? "csv"
      : extension === "xls"
        ? "xls"
        : extension === "xlsx"
          ? "xlsx"
          : "unknown";

  let rows: Record<string, string>[];
  let headers: string[];
  let sheetName = "Sheet1";

  if (sourceType === "csv") {
    const text = await file.text();
    rows = parseCSV(text, { delimiter: options.csvDelimiter }) as Record<
      string,
      string
    >[];
    headers = rows.length ? Object.keys(rows[0]) : [];
  } else {
    let XLSX: typeof import("xlsx");
    try {
      XLSX = await import("xlsx");
    } catch {
      throw new Error(
        "XLSX library not loaded. Install with: npm install xlsx",
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
      cellDates: true,
      raw: false,
    });
    sheetName = workbook.SheetNames[0] ?? "Sheet1";
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error("The selected file does not contain a readable sheet.");

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      raw: false,
      defval: "",
    }) as unknown[][];

    headers = (matrix[0] ?? []).map((value, index) =>
      maybeTrim(String(value)) || `Column ${index + 1}`,
    );

    rows = matrix
      .slice(1)
      .map((values) => {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          const cell = maybeTrim(String(values?.[index] ?? ""));
          if (cell) row[header] = cell;
        });
        return row;
      })
      .filter((row) => Object.values(row).some((v) => Boolean(maybeTrim(v))));
  }

  return { fileName: file.name, sourceType, sheetName, headers, rows };
}
