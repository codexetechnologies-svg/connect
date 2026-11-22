import { expect, test } from '@playwright/test';
import { authenticateAs } from './auth-session';

test.afterEach(async ({ page }) => {
  await page.evaluate(() => window.localStorage.removeItem('connect-pharma-demo-plan'));
});

test('saves the selected demo plan across a page reload', async ({ page }) => {
  await authenticateAs(page, 'admin');
  await page.goto('/admin/subscriptions');

  await page.getByRole('button', { name: 'Select plan' }).nth(1).click();
  await expect(page.getByRole('button', { name: 'Selected' })).toBeVisible();
  await expect(page.locator('p[role="status"]')).toContainText('Standard is selected in this browser.');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Selected' })).toBeVisible();
  await expect(page.locator('p[role="status"]')).toContainText('Standard is your saved demo selection.');
});
