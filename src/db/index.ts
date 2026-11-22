import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type Database = PostgresJsDatabase<typeof schema> & {
  $client: ReturnType<typeof postgres>;
};

let database: Database | undefined;

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

export function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!value) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL or NEON_DATABASE_URL must be configured.'
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new DatabaseConfigurationError('The configured database URL is invalid.');
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new DatabaseConfigurationError('The database URL must use the PostgreSQL protocol.');
  }

  return value;
}

export function getDatabase(): Database {
  if (!database) {
    database = drizzle(postgres(getDatabaseUrl(), {
      max: 1,
      prepare: false,
      ssl: 'require'
    }), { schema });
  }
  return database;
}
