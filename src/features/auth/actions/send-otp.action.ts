'use server';

import { and, eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';
import { DatabaseConfigurationError, getDatabase } from '@/db';
import { users } from '@/db/schema';
import {
  consumeEmailBudget,
  EmailQuotaExceededError,
  EmailRateLimitConfigurationError,
  reserveOtpRequest
} from '@/server/email/limits';
import { getSupabaseAuthClient, SupabaseAuthConfigurationError } from '@/server/supabase-auth';

const inputSchema = z.object({
  email: z.string().trim().email().max(320)
});

const genericMessage = 'If an approved account is registered, a one-time code has been sent.';

export type SendOtpResult =
  | { ok: true; message: string; cooldownSeconds: number }
  | { ok: false; error: string; details?: string; retryAfterSeconds?: number };

export async function sendOtpAction(input: unknown): Promise<SendOtpResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  const email = parsed.data.email.toLowerCase();
  let cooldownSeconds = 0;

  try {
    const ipAddress = (await headers()).get('x-nf-client-connection-ip') ?? 'unknown';
    const rateLimit = await reserveOtpRequest(email, ipAddress);
    if (!rateLimit.allowed) {
      return {
        ok: false,
        error: 'Please wait before requesting another code.',
        retryAfterSeconds: rateLimit.retryAfterSeconds
      };
    }
    cooldownSeconds = 60;

    const [account] = await getDatabase()
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.status, 'approved'),
        sql`lower(${users.email}) = ${email}`
      ))
      .limit(1);

    if (!account) {
      return { ok: true, message: genericMessage, cooldownSeconds: 60 };
    }

    await consumeEmailBudget();
    const { error } = await getSupabaseAuthClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });

    if (error) {
      console.error('Supabase OTP request failed:', error.name);
      return {
        ok: false,
        error: 'Unable to send a sign-in code right now. Please try later.',
        retryAfterSeconds: cooldownSeconds
      };
    }

    return { ok: true, message: genericMessage, cooldownSeconds: 60 };
  } catch (error) {
    if (error instanceof EmailQuotaExceededError) {
      return {
        ok: false,
        error: 'The email sending limit has been reached. Please try later.',
        ...(cooldownSeconds > 0 ? { retryAfterSeconds: cooldownSeconds } : {})
      };
    }
    if (
      error instanceof EmailRateLimitConfigurationError ||
      error instanceof DatabaseConfigurationError ||
      error instanceof SupabaseAuthConfigurationError
    ) {
      console.error('Email OTP configuration error:', error.message);
      return {
        ok: false,
        error: process.env.NODE_ENV === 'development'
          ? 'Sign-in setup is incomplete. Check the server logs and docs/auth-email-setup.md.'
          : 'Sign-in is temporarily unavailable. Please try again later.',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
        ...(cooldownSeconds > 0 ? { retryAfterSeconds: cooldownSeconds } : {})
      };
    }
    console.error('Email OTP request failed:', error instanceof Error ? error.name : 'Unknown error');
    return {
      ok: false,
      error: 'Sign-in is temporarily unavailable. Please try again later.',
      ...(cooldownSeconds > 0 ? { retryAfterSeconds: cooldownSeconds } : {})
    };
  }
}
