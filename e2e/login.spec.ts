import { expect, test } from '@playwright/test';

test('Clerk sign-in supports email and Google', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: /sign in to/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByLabel(/email/i).first()).toBeVisible();
  await expect(page.getByText(/continue/i).first()).toBeVisible();
});

test('database configuration issues explain why account access is unavailable', async ({ page }) => {
  await page.goto('/login?status=database-unavailable');
  await expect(page.getByRole('alert')).toContainText('application database is not configured');
  await expect(page.getByRole('heading', { name: /sign in to/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Return to home' })).toBeVisible();
});

test('legacy demo sign-in stays disabled', async ({ request }) => {
  const legacyDemoLogin = await request.post('/api/auth/login', {
    data: { email: 'admin@example.test', role: 'admin' }
  });
  expect(legacyDemoLogin.status()).toBe(410);
});

test('sign-up page does not create unprovisioned accounts', async ({ page }) => {
  await page.goto('/sign-up');
  await expect(page.getByRole('heading', { name: 'Registration is not open yet' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to sign in' })).toHaveAttribute('href', '/login');
});
