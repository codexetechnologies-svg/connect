import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DevelopmentMemoryRateLimiter,
  resolveEmailRateLimiterMode
} from './memory-rate-limiter';

test('only selects the memory limiter for development with both Upstash variables absent', () => {
  assert.equal(resolveEmailRateLimiterMode('development', undefined, undefined), 'development-memory');
  assert.equal(resolveEmailRateLimiterMode('production', undefined, undefined), 'missing');
  assert.equal(resolveEmailRateLimiterMode('development', 'https://redis.example', undefined), 'missing');
  assert.equal(resolveEmailRateLimiterMode('development', undefined, 'token'), 'missing');
  assert.equal(resolveEmailRateLimiterMode('development', 'https://redis.example', 'token'), 'upstash');
});

test('allows at most three OTP requests per email in fifteen minutes', () => {
  let now = 0;
  const limiter = new DevelopmentMemoryRateLimiter(() => now);
  const reserve = (email: string) => limiter.reserveOtpRequest(email, 'shared-ip');

  assert.deepEqual(reserve('email-a'), { allowed: true });
  now += 60_000;
  assert.deepEqual(reserve('email-a'), { allowed: true });
  now += 60_000;
  assert.deepEqual(reserve('email-a'), { allowed: true });
  now += 60_000;
  assert.deepEqual(reserve('email-a'), { allowed: false, retryAfterSeconds: 12 * 60 });
});

test('allows at most ten OTP requests per IP in one hour', () => {
  let now = 0;
  const limiter = new DevelopmentMemoryRateLimiter(() => now);

  for (let request = 1; request <= 10; request += 1) {
    assert.deepEqual(limiter.reserveOtpRequest(`email-${request}`, 'shared-ip'), { allowed: true });
    now += 60_000;
  }

  assert.deepEqual(
    limiter.reserveOtpRequest('email-11', 'shared-ip'),
    { allowed: false, retryAfterSeconds: 50 * 60 }
  );
});

test('enforces a sixty-second resend cooldown per email', () => {
  let now = 0;
  const limiter = new DevelopmentMemoryRateLimiter(() => now);

  assert.deepEqual(limiter.reserveOtpRequest('email-a', 'ip-a'), { allowed: true });
  now = 59_999;
  assert.deepEqual(
    limiter.reserveOtpRequest('email-a', 'ip-a'),
    { allowed: false, retryAfterSeconds: 1 }
  );
  now = 60_000;
  assert.deepEqual(limiter.reserveOtpRequest('email-a', 'ip-a'), { allowed: true });
});
