import { expect, test } from '@playwright/test';
import { authenticateAs } from './auth-session';

test('reviews a KYC request and approves the remaining sample batch', async ({ page }) => {
  await authenticateAs(page, 'admin');
  await page.goto('/admin/approvals');

  await page.getByRole('button', { name: 'Review' }).first().click();
  await expect(page.getByText('Review the submitted wholesale drug licence')).toBeVisible();
  await page.getByRole('button', { name: 'Request documents' }).click();
  await expect(page.locator('p[role="status"]')).toContainText('Documents requested from Asha Pharma');

  await page.getByRole('button', { name: 'Approve batch' }).click();
  await expect(page.locator('p[role="status"]')).toContainText('2 sample accounts approved');
  await expect(page.getByText('Pending in this sample').locator('xpath=..').getByText('0')).toBeVisible();
});
