import { createHmac } from 'node:crypto';
import type { Page } from '@playwright/test';

type TestRole = 'supplier' | 'medical-shop' | 'admin';

export async function authenticateAs(page: Page, role: TestRole): Promise<void> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to run authenticated browser tests.');
  }

  const payload = Buffer.from(JSON.stringify({
    id: '123e4567-e89b-12d3-a456-426614174000',
    role,
    authMethod: 'email-otp',
    approved: true,
    exp: Math.floor(Date.now() / 1000) + 60 * 60
  })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';

  await page.context().addCookies([{
    name: 'cp_session',
    value: `${payload}.${signature}`,
    url: baseURL,
    httpOnly: true,
    secure: false,
    sameSite: 'Strict'
  }]);
}
