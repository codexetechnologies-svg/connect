'use server';

import { and, eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getDatabase } from '@/db';
import { users } from '@/db/schema';
import { getSessionSecret } from '@/lib/auth/session-secret';
import { signSession, type AppSession } from '@/lib/auth/session';
import { getRoleRoute, type AccountRole } from '@/server/auth';
import { getSupabaseAuthClient } from '@/server/supabase-auth';

const inputSchema = z.object({
  email: z.string().trim().email().max(320),
  code: z.string().regex(/^\d{6}$/)
});

const sessionLifetimeSeconds = 30 * 24 * 60 * 60;

export type VerifyOtpResult =
  | { ok: true; redirect: string }
  | { ok: false; error: string };

export async function verifyOtpAction(input: unknown): Promise<VerifyOtpResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid email address and six-digit code.' };
  }

  const secret = getSessionSecret();
  if (!secret) {
    return { ok: false, error: 'Sign-in is not configured. Please contact support.' };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const { data, error } = await getSupabaseAuthClient().auth.verifyOtp({
      email,
      token: parsed.data.code,
      type: 'email'
    });

    if (error || !data.user?.email) {
      return { ok: false, error: 'The code is invalid or expired. Request a new code and try again.' };
    }

    const [account] = await getDatabase()
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(
        eq(users.status, 'approved'),
        sql`lower(${users.email}) = ${email}`
      ))
      .limit(1);

    if (!account) {
      return { ok: false, error: 'The code is invalid or expired. Request a new code and try again.' };
    }

    const now = new Date();
    await getDatabase()
      .update(users)
      .set({ emailVerified: true, updatedAt: now })
      .where(eq(users.id, account.id));

    const role: AccountRole = account.role === 'medical_shop' ? 'medical-shop' : account.role;
    const session: AppSession = {
      id: account.id,
      role,
      authMethod: 'email-otp',
      approved: true,
      exp: Math.floor(now.getTime() / 1000) + sessionLifetimeSeconds
    };
    const token = await signSession(session, secret);
    (await cookies()).set('cp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: sessionLifetimeSeconds
    });

    return { ok: true, redirect: getRoleRoute(role) };
  } catch (error) {
    console.error('Email OTP verification failed:', error instanceof Error ? error.name : 'Unknown error');
    return { ok: false, error: 'Unable to verify the code right now. Please try again.' };
  }
}
