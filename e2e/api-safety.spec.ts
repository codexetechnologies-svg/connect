import { expect, test } from '@playwright/test';

test('does not accept KYC submissions before authentication', async ({ request }) => {
  const response = await request.post('/api/kyc/documents', {
    data: {
      documentType: 'wholesale-drug-license',
      consent: true
    }
  });

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toMatchObject({
    error: expect.stringContaining('sign in')
  });
});
