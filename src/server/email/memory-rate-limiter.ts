type WindowResult = {
  success: boolean;
  reset: number;
};

type ReservationResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export class DevelopmentMemoryLimiterCapacityError extends Error {
  constructor() {
    super('The development in-memory email limiter reached its safety capacity.');
    this.name = 'DevelopmentMemoryLimiterCapacityError';
  }
}

const emailWindowMs = 15 * 60 * 1000;
const ipWindowMs = 60 * 60 * 1000;
const dailyWindowMs = 24 * 60 * 60 * 1000;
const monthlyWindowMs = 30 * dailyWindowMs;
const maxMemoryKeys = 10_000;

export function resolveEmailRateLimiterMode(
  nodeEnv: string | undefined,
  url: string | undefined,
  token: string | undefined
): 'upstash' | 'development-memory' | 'missing' {
  if (url && token) return 'upstash';
  if (!url && !token && nodeEnv === 'development') return 'development-memory';
  return 'missing';
}

export class DevelopmentMemoryRateLimiter {
  private readonly windowEvents = new Map<string, number[]>();
  private readonly cooldowns = new Map<string, number>();
  private requestCount = 0;

  constructor(private readonly now: () => number = Date.now) {}

  reserveOtpRequest(emailHash: string, ipHash: string): ReservationResult {
    const now = this.now();
    this.pruneState(now);
    const emailResult = this.consumeWindow(`email:${emailHash}`, 3, emailWindowMs, now);
    const ipResult = this.consumeWindow(`ip:${ipHash}`, 10, ipWindowMs, now);

    if (!emailResult.success) {
      return { allowed: false, retryAfterSeconds: this.retryAfter(emailResult.reset, now) };
    }
    if (!ipResult.success) {
      return { allowed: false, retryAfterSeconds: this.retryAfter(ipResult.reset, now) };
    }

    const cooldownKey = `cooldown:${emailHash}`;
    const cooldownExpiresAt = this.cooldowns.get(cooldownKey);
    if (cooldownExpiresAt && cooldownExpiresAt > now) {
      return { allowed: false, retryAfterSeconds: this.retryAfter(cooldownExpiresAt, now) };
    }
    this.cooldowns.set(cooldownKey, now + 60_000);
    this.ensureWithinCapacity();
    return { allowed: true };
  }

  consumeEmailBudget(): boolean {
    const now = this.now();
    this.pruneState(now);
    const daily = this.consumeWindow('budget:daily', 100, dailyWindowMs, now);
    const monthly = this.consumeWindow('budget:monthly', 3000, monthlyWindowMs, now);
    return daily.success && monthly.success;
  }

  private consumeWindow(key: string, limit: number, windowMs: number, now: number): WindowResult {
    const activeEvents = (this.windowEvents.get(key) ?? [])
      .filter((timestamp) => timestamp > now - windowMs);
    if (activeEvents.length >= limit) {
      this.windowEvents.set(key, activeEvents);
      return { success: false, reset: activeEvents[0] + windowMs };
    }

    activeEvents.push(now);
    this.windowEvents.set(key, activeEvents);
    this.ensureWithinCapacity();
    return { success: true, reset: now + windowMs };
  }

  private retryAfter(reset: number, now: number): number {
    return Math.max(1, Math.ceil((reset - now) / 1000));
  }

  private pruneState(now: number): void {
    this.requestCount += 1;
    if (this.requestCount % 128 !== 0 && this.windowEvents.size < maxMemoryKeys) return;

    for (const [key, events] of this.windowEvents) {
      const activeEvents = events.filter((timestamp) => timestamp > now - monthlyWindowMs);
      if (activeEvents.length === 0) {
        this.windowEvents.delete(key);
      } else {
        this.windowEvents.set(key, activeEvents);
      }
    }
    for (const [key, expiresAt] of this.cooldowns) {
      if (expiresAt <= now) this.cooldowns.delete(key);
    }
  }

  private ensureWithinCapacity(): void {
    if (this.windowEvents.size > maxMemoryKeys) {
      throw new DevelopmentMemoryLimiterCapacityError();
    }
  }
}
