import { expect, test } from '@playwright/test';

test('map shows setup guidance and lists supplier coverage without an API key', async ({ page }) => {
  await page.goto('/map.html');

  await expect(page.getByRole('heading', { name: 'Map preview is not configured' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fit all suppliers' })).toBeDisabled();
  await expect(page.getByText('Astra Pharma Distributors')).toBeVisible();
});
