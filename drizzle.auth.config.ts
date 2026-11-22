import { loadEnvConfig } from '@next/env';
import type { Config } from 'drizzle-kit';

loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Set DATABASE_URL or NEON_DATABASE_URL before running the auth schema push.');
}

export default {
  schema: './src/db/auth-schema.ts',
  out: './database/auth-migrations',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl }
} satisfies Config;
