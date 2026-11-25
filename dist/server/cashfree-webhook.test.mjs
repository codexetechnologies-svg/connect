import { createHmac } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCashfreeWebhookSignature } from './cashfree-webhook.mjs';

test('accepts a Cashfree signature for the exact timestamp and raw body', () => {
  const timestamp = '1784912400000';
  const rawBody = Buffer.from('{"type":"PAYMENT_SUCCESS_WEBHOOK"}');
  const secret = 'test-secret';
  const signature = createHmac('sha256', secret)
    .update(timestamp)
    .update(rawBody)
    .digest('base64');

  assert.equal(verifyCashfreeWebhookSignature(rawBody, signature, timestamp, secret), true);
});

test('rejects altered payloads and malformed signature inputs', () => {
  const timestamp = '1784912400000';
  const rawBody = Buffer.from('{"type":"PAYMENT_SUCCESS_WEBHOOK"}');
  const signature = createHmac('sha256', 'test-secret')
    .update(timestamp)
    .update(rawBody)
    .digest('base64');

  assert.equal(verifyCashfreeWebhookSignature(Buffer.from('tampered'), signature, timestamp, 'test-secret'), false);
  assert.equal(verifyCashfreeWebhookSignature(rawBody, signature, 'bad-timestamp', 'test-secret'), false);
  assert.equal(verifyCashfreeWebhookSignature(rawBody, signature, timestamp, ''), false);
});
