import { expect, test } from '@playwright/test';
import { authenticateAs } from './auth-session';

test('filters wholesale offers and applies the comparison', async ({ page }) => {
  await authenticateAs(page, 'medical-shop');
  await page.goto('/search');
  await expect(page.getByText('3 suppliers found')).toBeVisible();

  await page.getByLabel('Brand / generic').selectOption('generic');
  await expect(page.getByText('1 supplier found')).toBeVisible();
  await expect(page.getByText('Bharat Labs')).toBeVisible();
  await expect(page.getByText('Astra Pharma Distributors')).toHaveCount(0);

  await page.getByRole('button', { name: 'Compare suppliers' }).click();
  await expect(page.locator('p[role="status"]')).toContainText('Comparison updated with your selected filters.');

  await page.getByLabel('Pack size').selectOption('Strip of 15');
  await expect(page.getByText('No suppliers match those filters.')).toBeVisible();
  await page.getByLabel('Brand / generic').selectOption('all');
  await expect(page.getByText('1 supplier found')).toBeVisible();
});
