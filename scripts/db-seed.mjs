import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const seedPath = resolve(process.cwd(), 'schema', 'seed-notes.txt');
writeFileSync(seedPath, [
  'Seed plan for Eduflow Universe',
  '- module_registry rows can be synchronized from the dashboard bootstrap',
  '- legacy pack fixtures may be inserted once Supabase credentials are available',
  '',
].join('\n'), 'utf8');

console.log(`[db:seed] Seed note written to ${seedPath}.`);
