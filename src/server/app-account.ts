import { auth, clerkClient } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { DatabaseConfigurationError, getDatabase } from '@/db';
import { users } from '@/db/schema';
import { getSessionSecret } from '@/lib/auth/session-secret';
import { verifySession, type SessionRole } from '@/lib/auth/session';

export type AppRole = SessionRole;

export type AppAccount = {
  id: string;
  role: AppRole;
};

const getCurrentAppAccount = cache(async (): Promise<AppAccount> => {
  if (process.env.NODE_ENV === 'development' && process.env.PLAYWRIGHT_TEST_MODE === '1') {
    const secret = getSessionSecret();
    const testSession = secret
      ? await verifySession((await cookies()).get('cp_session')?.value, secret)
      : null;

    if (testSession) {
      return { id: testSession.id, role: testSession.role };
    }
  }

  const { userId } = await auth();
  if (!userId) redirect('/login');

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  if (clerkUser.banned || clerkUser.locked) redirect('/login?status=account-unavailable');

  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  );
  if (!primaryEmail || primaryEmail.verification?.status !== 'verified') {
    redirect('/login?status=email-verification-required');
  }

  let database: ReturnType<typeof getDatabase>;
  try {
    database = getDatabase();
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      redirect('/login?status=database-unavailable');
    }
    throw error;
  }

  const [account] = await database
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(sql`lower(${users.email}) = ${primaryEmail.emailAddress.toLowerCase()}`)
    .limit(1);

  if (!account || account.status !== 'approved') {
    redirect('/login?status=approval-required');
  }

  const role: AppRole = account.role === 'medical_shop' ? 'medical-shop' : account.role;
  return { id: account.id, role };
});

export async function requireAppAccount(): Promise<AppAccount> {
  return getCurrentAppAccount();
}

export async function requireAppRole(...allowedRoles: AppRole[]): Promise<AppAccount> {
  const account = await getCurrentAppAccount();
  if (!allowedRoles.includes(account.role)) notFound();
  return account;
}
