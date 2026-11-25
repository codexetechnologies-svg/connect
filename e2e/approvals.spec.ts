import { expect, test } from '@playwright/test';

test('admin approval queue displays pending accounts and explains its scope', async ({ page }) => {
  test.skip(!process.env.PLAYWRIGHT_TEST_DATABASE_URL, 'requires an isolated PostgreSQL test database');
  await page.goto('/admin/approvals');

  await expect(page.getByRole('heading', { name: 'Pending account approvals' })).toBeVisible();
  await expect(page.getByText(/does not verify a business licence or KYC documents/i)).toBeVisible();
});

test('empty approval queue uses the shared status icon', async ({ page }) => {
  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { fullName: 'Test Admin', role: 'admin' } })
  }));
  await page.route('**/api/admin/accounts/pending', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]'
  }));

  await page.goto('/admin/approvals.html');

  await expect(page.getByText('You’re all caught up')).toBeVisible();
  await expect(page.locator('.approval-empty-icon .approval-status-svg')).toBeVisible();
});
