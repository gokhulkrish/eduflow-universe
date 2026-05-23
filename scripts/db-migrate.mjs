import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const sqlPath = resolve(process.cwd(), 'schema', '001_initial.sql');
const sql = readFileSync(sqlPath, 'utf8');

if (!process.env.DATABASE_URL) {
  console.log(`[db:migrate] DATABASE_URL is not set. Loaded ${sql.length} characters from ${sqlPath}.`);
  process.exit(0);
}

const psql = spawnSync('psql', [process.env.DATABASE_URL, '-v', 'ON_ERROR_STOP=1'], {
  input: sql,
  encoding: 'utf8',
});

if (psql.error) {
  console.error('[db:migrate] Failed to invoke psql:', psql.error.message);
  process.exit(1);
}

if (psql.status !== 0) {
  console.error(psql.stdout || '');
  console.error(psql.stderr || '');
  process.exit(psql.status || 1);
}

console.log('[db:migrate] Migration applied successfully.');
