import type { KeyingConfig } from './types';

export function buildImportKey(
  values: Array<string | null | undefined>,
  separator = '-',
): string {
  return values
    .map(v => String(v ?? '').trim())
    .filter(Boolean)
    .join(separator)
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildRowKey(
  row: Record<string, unknown>,
  config: KeyingConfig,
): string {
  return buildImportKey(
    config.fields.map(f => String(row[f] ?? '')),
    config.separator,
  );
}
