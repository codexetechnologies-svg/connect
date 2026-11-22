import type { Config } from 'drizzle-kit';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Set DATABASE_URL or NEON_DATABASE_URL before running Drizzle Kit.');
}

export default {
  schema: './src/db/schema.ts',
  out: './database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl
  }
} satisfies Config;
