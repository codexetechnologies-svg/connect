import { expect, test } from '@playwright/test';
import { authenticateAs } from './auth-session';

test('unauthenticated visitors are redirected to Clerk sign-in', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login|sign-in/);
  await expect(page.getByText('Sign in', { exact: false }).first()).toBeVisible();
});

test('approved test sessions can open protected routes', async ({ page }) => {
  await authenticateAs(page, 'medical-shop');
  await page.goto('/search');
  await expect(page.getByRole('heading', { name: 'Find the best wholesale price' })).toBeVisible();
});

test('sign out removes the protected app session', async ({ page }) => {
  await authenticateAs(page, 'admin');
  await page.goto('/admin/subscriptions');
  await page.context().clearCookies({ name: 'cp_session' });

  await page.goto('/admin/subscriptions');
  await expect(page).toHaveURL(/\/login|sign-in/);
});

test('supplier accounts cannot open admin routes', async ({ page }) => {
  await authenticateAs(page, 'supplier');
  await page.goto('/admin/approvals');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Approvals' })).toHaveCount(0);
  await expect(page.locator('body')).toContainText('404');
});

test('medical shop accounts cannot open supplier routes', async ({ page }) => {
  await authenticateAs(page, 'medical-shop');
  await page.goto('/supplier/catalogue');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Catalogue' })).toHaveCount(0);
  await expect(page.locator('body')).toContainText('404');
});
