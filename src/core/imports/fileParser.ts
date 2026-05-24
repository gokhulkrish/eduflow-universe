import * as XLSX from 'xlsx';

export async function parseFileToRows(
  fileBuffer: ArrayBuffer,
  mimeType: string,
): Promise<Record<string, unknown>[]> {
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true, raw: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Workbook has no readable sheets.');
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
  }

  if (mimeType.includes('csv') || mimeType.includes('text')) {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(fileBuffer);
    return parseCSVToRows(text);
  }

  throw new Error(`Unsupported mime type: ${mimeType}`);
}

function parseCSVToRows(text: string): Record<string, unknown>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? null;
    });
    rows.push(row);
  }

  return rows;
}
