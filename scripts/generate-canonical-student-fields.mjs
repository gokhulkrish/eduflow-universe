// Canonical Student Field Seed Generator
// Reads data/detected_student_headers.csv → outputs src/lib/canonical-student-fields.seed.ts
//
// Usage: node scripts/generate-canonical-student-fields.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INPUT_CSV = path.join(ROOT, 'data', 'detected_student_headers.csv');
const OUTPUT_TS = path.join(ROOT, 'src', 'lib', 'canonical-student-fields.seed.ts');

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const [headerLine, ...rows] = lines;
  const headers = headerLine.split(',').map(h => h.trim());
  return rows.map(row => {
    const cols = row.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
    return obj;
  });
}

function normalizeType(raw) {
  const t = String(raw || '').toLowerCase();
  if (t.includes('textarea')) return 'textarea';
  if (t.includes('date')) return 'date';
  if (t.includes('number')) return 'number';
  if (t.includes('select')) return 'select';
  return 'text';
}

function normalizeStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'archived') return 'archived';
  if (s === 'deleted') return 'deleted';
  return 'active';
}

function guessAliases(label, key) {
  const set = new Set();
  const cleanLabel = String(label || '').trim();
  const cleanKey = String(key || '').trim();

  if (cleanLabel) set.add(cleanLabel.toLowerCase());
  if (cleanKey) {
    set.add(cleanKey);
    for (const part of cleanKey.split(/[_\.]/)) {
      if (part) set.add(part.toLowerCase());
    }
  }

  return Array.from(set).filter(Boolean);
}

function toTsField(row, index) {
  const label = row.label || '';
  const key = row.key || '';
  const group = row.group || 'Other Information';
  const type = normalizeType(row.type || '');
  const status = normalizeStatus(row.status || '');
  const now = '2024-01-01T00:00:00.000Z';

  return {
    id: key,
    module: 'student',
    key,
    label,
    group,
    type,
    status,
    source: 'base',
    order: index + 1,
    aliases: guessAliases(label, key),
    createdAt: now,
    updatedAt: now,
  };
}

function escapeApos(s) {
  return String(s).replace(/'/g, "\\'");
}

function toTsFile(fields) {
  const lines = [
    '// AUTO-GENERATED from data/detected_student_headers.csv',
    '// Do not edit manually. Regenerate via: node scripts/generate-canonical-student-fields.mjs',
    '',
    `import type { CanonicalStudentField } from '@/lib/canonical-student-field.types';`,
    '',
    'export const CANONICAL_STUDENT_FIELDS_SEED: CanonicalStudentField[] = [',
  ];

  for (const f of fields) {
    const aliases = f.aliases.map(a => `'${escapeApos(a)}'`).join(', ');
    lines.push(`  { id: '${escapeApos(f.id)}', module: 'student', key: '${escapeApos(f.key)}', label: '${escapeApos(f.label)}', group: '${escapeApos(f.group)}', type: '${f.type}', status: '${f.status}', source: 'base', order: ${f.order}, aliases: [${aliases}], createdAt: '${f.createdAt}', updatedAt: '${f.updatedAt}' },`);
  }

  lines.push('];');
  lines.push('');
  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(INPUT_CSV)) {
    console.error('Input CSV not found:', INPUT_CSV);
    console.error('Run the extraction script first to create data/detected_student_headers.csv');
    process.exit(1);
  }

  const csv = fs.readFileSync(INPUT_CSV, 'utf8');
  const rows = parseCsv(csv);
  const fields = rows.filter(r => r.label).map((row, index) => toTsField(row, index));

  const ts = toTsFile(fields);
  fs.mkdirSync(path.dirname(OUTPUT_TS), { recursive: true });
  fs.writeFileSync(OUTPUT_TS, ts, 'utf8');
  console.log(`✓ Generated ${fields.length} canonical student fields → ${path.relative(ROOT, OUTPUT_TS)}`);
}

main();
