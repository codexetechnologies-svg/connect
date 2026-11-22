import { loadEnvConfig } from '@next/env';
import { sql } from 'drizzle-orm';
import { getDatabase } from '@/db';

loadEnvConfig(process.cwd());

let failures = 0;

function report(status: 'PASS' | 'MISSING' | 'FAIL', label: string, detail?: string): void {
  if (status !== 'PASS') failures += 1;
  console.log(`[${status}] ${label}${detail ? ` — ${detail}` : ''}`);
}

function getConnectionFailureDetails(error: unknown): string {
  let current = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!(current instanceof Error)) return 'connection failed';

    const code = 'code' in current && typeof current.code === 'string'
      ? ` (${current.code})`
      : '';
    const cause = 'cause' in current ? current.cause : undefined;
    if (cause instanceof Error) {
      current = cause;
      continue;
    }

    const message = current.message.replace(
      /postgres(?:ql)?:\/\/[^\s]+/gi,
      '[database URL redacted]'
    );
    return `${current.name}${code}: ${message}`;
  }
  return 'connection failed';
}

async function checkDatabase(): Promise<void> {
  const value = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!value) {
    report('MISSING', 'DATABASE_URL or NEON_DATABASE_URL');
    return;
  }

  if (!/^postgres(?:ql)?:\/\//i.test(value)) {
    report('FAIL', 'PostgreSQL connection', 'URL must use postgres:// or postgresql://');
    return;
  }

  let database: ReturnType<typeof getDatabase> | undefined;
  try {
    database = getDatabase();
    await database.execute(sql`select 1`);
    report('PASS', 'PostgreSQL connection');
  } catch (error) {
    report('FAIL', 'PostgreSQL connection', getConnectionFailureDetails(error));
  } finally {
    if (database) await database.$client.end({ timeout: 1 });
  }
}

async function main(): Promise<void> {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkPublishableKey || !clerkSecretKey) {
    report(
      'MISSING',
      'Clerk configuration',
      'set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY'
    );
  } else {
    report('PASS', 'Clerk configuration');
  }

  await checkDatabase();

  if (failures > 0) {
    console.error(`\nAuthentication setup incomplete: ${failures} check(s) need attention.`);
    process.exitCode = 1;
  } else {
    console.log('\nAuthentication environment checks passed.');
  }
}

main().catch((error: unknown) => {
  console.error('Auth environment check failed:', error instanceof Error ? error.name : 'unknown error');
  process.exitCode = 1;
});
