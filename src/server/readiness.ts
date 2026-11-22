export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
}

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function isRateLimitingConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
}

export function isCashfreeConfigured(): boolean {
  return Boolean(
    process.env.CASHFREE_APP_ID &&
    process.env.CASHFREE_SECRET_KEY &&
    process.env.CASHFREE_WEBHOOK_SECRET &&
    (process.env.CASHFREE_ENV === 'sandbox' || process.env.CASHFREE_ENV === 'production')
  );
}
