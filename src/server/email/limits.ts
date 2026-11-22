import 'server-only';

import { createHash } from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  DevelopmentMemoryLimiterCapacityError,
  DevelopmentMemoryRateLimiter,
  resolveEmailRateLimiterMode
} from './memory-rate-limiter';

export class EmailRateLimitConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailRateLimitConfigurationError';
  }
}

export class EmailQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailQuotaExceededError';
  }
}

const developmentMemoryLimiter = new DevelopmentMemoryRateLimiter();
let memoryWarningShown = false;

function createLimiters() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new EmailRateLimitConfigurationError(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured.'
    );
  }

  const redis = new Redis({ url, token });
  return {
    redis,
    byEmail: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '15 m'),
      prefix: 'connect-pharma:otp-email'
    }),
    byIp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      prefix: 'connect-pharma:otp-ip'
    }),
    dailyBudget: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(100, '1 d'),
      prefix: 'connect-pharma:email-budget-daily'
    }),
    monthlyBudget: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(3000, '30 d'),
      prefix: 'connect-pharma:email-budget-monthly'
    })
  };
}

let limiters: ReturnType<typeof createLimiters> | undefined;

function getLimiters(): ReturnType<typeof createLimiters> {
  limiters ??= createLimiters();
  return limiters;
}

function shouldUseDevelopmentMemoryLimiter(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const mode = resolveEmailRateLimiterMode(process.env.NODE_ENV, url, token);
  if (mode === 'upstash') return false;
  if (mode === 'missing') {
    throw new EmailRateLimitConfigurationError(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured.'
    );
  }

  if (!memoryWarningShown) {
    console.warn(
      'Upstash is not configured; using development-only in-memory email limits. This fallback is not shared across processes.'
    );
    memoryWarningShown = true;
  }
  return true;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function retryAfter(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export async function reserveOtpRequest(email: string, ipAddress: string): Promise<
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }
> {
  if (shouldUseDevelopmentMemoryLimiter()) {
    try {
      return developmentMemoryLimiter.reserveOtpRequest(hash(email), hash(ipAddress));
    } catch (error) {
      if (error instanceof DevelopmentMemoryLimiterCapacityError) {
        throw new EmailRateLimitConfigurationError(error.message);
      }
      throw error;
    }
  }

  const configured = getLimiters();
  const [emailResult, ipResult] = await Promise.all([
    configured.byEmail.limit(hash(email)),
    configured.byIp.limit(hash(ipAddress))
  ]);

  if (!emailResult.success) {
    return { allowed: false, retryAfterSeconds: retryAfter(emailResult.reset) };
  }
  if (!ipResult.success) {
    return { allowed: false, retryAfterSeconds: retryAfter(ipResult.reset) };
  }

  const cooldownKey = `connect-pharma:otp-cooldown:${hash(email)}`;
  const reserved = await configured.redis.set(cooldownKey, '1', { nx: true, ex: 60 });
  if (reserved !== 'OK') {
    const remaining = Number(await configured.redis.ttl(cooldownKey));
    return {
      allowed: false,
      retryAfterSeconds: Number.isFinite(remaining) && remaining > 0 ? remaining : 60
    };
  }

  return { allowed: true };
}

export async function consumeEmailBudget(): Promise<void> {
  if (shouldUseDevelopmentMemoryLimiter()) {
    try {
      if (!developmentMemoryLimiter.consumeEmailBudget()) {
        throw new EmailQuotaExceededError('The configured email quota has been reached.');
      }
      return;
    } catch (error) {
      if (error instanceof DevelopmentMemoryLimiterCapacityError) {
        throw new EmailRateLimitConfigurationError(error.message);
      }
      throw error;
    }
  }

  const configured = getLimiters();
  const [daily, monthly] = await Promise.all([
    configured.dailyBudget.limit('all-senders'),
    configured.monthlyBudget.limit('all-senders')
  ]);

  if (!daily.success || !monthly.success) {
    throw new EmailQuotaExceededError('The configured email quota has been reached.');
  }
}
