import { expect, test } from '@playwright/test';
import { authenticateAs } from './auth-session';

test('saves a demo response and exports the enquiry list', async ({ page }) => {
  await authenticateAs(page, 'supplier');
  await page.goto('/supplier/enquiries');

  await page.getByRole('button', { name: 'Respond' }).first().click();
  await page.getByLabel('Draft a quote response').fill('₹18 per strip; delivery in two days.');
  await page.getByRole('button', { name: 'Save response' }).click();
  await expect(page.locator('p[role="status"]')).toContainText('Response saved for this demo session');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export lead list' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('connect-pharma-leads.csv');
});
