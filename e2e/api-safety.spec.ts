import { expect, test } from '@playwright/test';

test('does not report KYC success before authentication and private document storage exist', async ({
  request
}) => {
  const response = await request.post('/api/kyc/submit', {
    data: {
      fullName: 'Demo Applicant',
      email: 'applicant@example.test',
      phone: '9000000000',
      entityName: 'Demo Pharmacy',
      role: 'supplier',
      documentType: 'wholesale-drug-license',
      consent: true
    }
  });

  expect(response.status()).toBe(503);
  await expect(response.json()).resolves.toMatchObject({
    error: expect.stringContaining('private document storage')
  });
});
