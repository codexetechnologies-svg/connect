import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyCashfreeWebhookSignature(rawBody, signature, timestamp, secret) {
  if (!Buffer.isBuffer(rawBody) || !secret || !signature || !/^\d+$/.test(timestamp)) return false;
  const expected = createHmac('sha256', secret).update(timestamp).update(rawBody).digest();
  const provided = Buffer.from(signature, 'base64');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
