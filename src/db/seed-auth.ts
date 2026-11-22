import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDatabase } from '@/db';
import { users } from '@/db/schema';

loadEnvConfig(process.cwd());

const emailSchema = z.string().trim().email().max(320);

type SeedAccount = {
  role: 'admin' | 'medical_shop' | 'supplier';
  fullName: string;
  email: string;
};

function getSeedAccounts(): SeedAccount[] {
  const accounts = [
    { role: 'admin', fullName: 'Local Test Admin', value: process.env.AUTH_SEED_ADMIN_EMAIL },
    {
      role: 'medical_shop',
      fullName: 'Local Test Medical Shop',
      value: process.env.AUTH_SEED_MEDICAL_SHOP_EMAIL
    },
    { role: 'supplier', fullName: 'Local Test Supplier', value: process.env.AUTH_SEED_SUPPLIER_EMAIL }
  ] as const;

  return accounts.map(({ role, fullName, value }) => {
    const parsed = emailSchema.safeParse(value);
    if (!parsed.success) {
      throw new Error(`AUTH_SEED_${role.toUpperCase()}_EMAIL must be a valid email address.`);
    }
    return { role, fullName, email: parsed.data.toLowerCase() };
  });
}

function requireLocalSeedConfiguration(): {
  databaseUrl: string;
  supabaseUrl: string;
  serviceRoleKey: string;
  accounts: SeedAccount[];
} {
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true') {
    throw new Error('Auth seeding is disabled in production and Netlify environments.');
  }
  if (process.env.AUTH_SEED_CONFIRM !== 'LOCAL_TEST_USERS') {
    throw new Error(
      'Set AUTH_SEED_CONFIRM=LOCAL_TEST_USERS only when targeting a local or test database.'
    );
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabasePublicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const sessionSecret = process.env.SESSION_SECRET;
  const missing = [
    !databaseUrl && 'DATABASE_URL or NEON_DATABASE_URL',
    !supabaseUrl && 'SUPABASE_URL',
    !supabasePublicKey && 'SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY',
    !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
    (!sessionSecret || Buffer.byteLength(sessionSecret, 'utf8') < 32) && 'SESSION_SECRET (at least 32 bytes)',
    !process.env.RESEND_API_KEY && 'RESEND_API_KEY',
    !process.env.EMAIL_FROM && 'EMAIL_FROM'
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}.`);
  }
  if (!databaseUrl || !supabaseUrl || !serviceRoleKey) {
    throw new Error('Auth seed configuration is incomplete.');
  }

  return {
    databaseUrl,
    supabaseUrl,
    serviceRoleKey,
    accounts: getSeedAccounts()
  };
}

function pushSchema(): void {
  console.log('Pushing the auth enums and users table to the configured local/test database...');
  execSync('npx drizzle-kit push --config=drizzle.auth.config.ts', {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit'
  });
}

async function confirmSeedTargets(databaseUrl: string, supabaseUrl: string): Promise<void> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Auth seeding requires an interactive terminal for target confirmation.');
  }

  const databaseHost = new URL(databaseUrl).host;
  const supabaseHost = new URL(supabaseUrl).host;
  console.warn(`This will push schema and seed approved test users in database ${databaseHost}.`);
  console.warn(`The Supabase Auth project is ${supabaseHost}. Use local/test services only.`);

  const prompt = createInterface({ input: stdin, output: stdout });
  let answer: string;
  try {
    answer = await prompt.question(`Type the database host "${databaseHost}" to continue: `);
  } finally {
    prompt.close();
  }
  if (answer.trim() !== databaseHost) {
    throw new Error('Target confirmation did not match; no schema or users were changed.');
  }
}

async function main(): Promise<void> {
  const config = requireLocalSeedConfiguration();
  const uniqueEmails = new Set(config.accounts.map((account) => account.email));
  if (uniqueEmails.size !== config.accounts.length) {
    throw new Error('Use a different controlled inbox for each seeded role.');
  }
  if (!/^https?:\/\//i.test(config.supabaseUrl)) {
    throw new Error('SUPABASE_URL must be an HTTP or HTTPS URL.');
  }
  if (!/^postgres(?:ql)?:\/\//i.test(config.databaseUrl)) {
    throw new Error('DATABASE_URL or NEON_DATABASE_URL must use the PostgreSQL protocol.');
  }

  await confirmSeedTargets(config.databaseUrl, config.supabaseUrl);
  pushSchema();

  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const database = getDatabase();

  async function ensureSupabaseAuthUser(account: SeedAccount): Promise<void> {
    let found = false;
    for (let page = 1; page <= 100; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(`Unable to inspect Supabase Auth users (${error.name}).`);
      if (data.users.some((user) => user.email?.toLowerCase() === account.email)) {
        found = true;
        break;
      }
      if (data.users.length < 1000) break;
      if (page === 100) {
        throw new Error('Supabase Auth user listing exceeded the safety page limit.');
      }
    }

    if (found) return;
    const { error } = await supabase.auth.admin.createUser({
      email: account.email,
      email_confirm: true,
      user_metadata: { seededForLocalTesting: true }
    });
    if (error) {
      throw new Error(`Unable to create the Supabase Auth user for role ${account.role} (${error.name}).`);
    }
  }

  for (const account of config.accounts) {
    await database.insert(users).values({
      role: account.role,
      email: account.email,
      fullName: account.fullName,
      status: 'approved',
      emailVerified: true
    }).onConflictDoNothing({ target: users.email });

    const [existingAccount] = await database
      .select({ role: users.role, status: users.status })
      .from(users)
      .where(eq(users.email, account.email))
      .limit(1);

    if (existingAccount?.role !== account.role || existingAccount.status !== 'approved') {
      throw new Error(
        `Refusing to modify an existing application account with a different role or status (${account.role}).`
      );
    }

    await ensureSupabaseAuthUser(account);
    console.log(`PASS seeded approved ${account.role} account in PostgreSQL and Supabase Auth.`);
  }

  console.log('Auth seed completed. Use only the configured test inboxes for OTP sign-in.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Auth seed failed.');
  process.exitCode = 1;
});
