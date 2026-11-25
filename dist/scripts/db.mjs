import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL or NEON_DATABASE_URL must be configured.');
  process.exit(1);
}

export function createSql() {
  return postgres(databaseUrl, { max: 2, ssl: 'require' });
}
