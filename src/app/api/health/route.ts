import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { DatabaseConfigurationError, getDatabase } from '@/db';
import {
  isCashfreeConfigured,
  isEmailDeliveryConfigured,
  isR2Configured,
  isRateLimitingConfigured,
  isClerkConfigured
} from '@/server/readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    database: false,
    identityProvider: isClerkConfigured(),
    emailDelivery: isEmailDeliveryConfigured(),
    rateLimiting: isRateLimitingConfigured(),
    privateStorage: isR2Configured(),
    payments: isCashfreeConfigured()
  };
  let configurationError = false;

  try {
    await getDatabase().execute(sql`select 1`);
    checks.database = true;
  } catch (error) {
    configurationError = error instanceof DatabaseConfigurationError;
    console.error('Readiness database check failed:', error instanceof Error ? error.name : 'Unknown error');
  }

  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        ...checks,
        database: checks.database ? 'connected' : configurationError ? 'not_configured' : 'unavailable'
      }
    },
    { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
