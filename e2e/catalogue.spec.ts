import { expect, test } from '@playwright/test';
import { authenticateAs } from './auth-session';

test('imports valid catalogue rows from a CSV file', async ({ page }) => {
  await authenticateAs(page, 'supplier');
  await page.goto('/supplier/catalogue');

  await page.getByLabel('Choose catalogue CSV').setInputFiles({
    name: 'catalogue.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('medicine,composition,brand,pack,basePrice,stock\nDemo Medicine,Example Compound,Demo Brand,Box of 10,12.5,In Stock')
  });

  await expect(page.locator('p[role="status"]')).toContainText('Added 1 row to this page.');
  await expect(page.getByText('Demo Medicine')).toBeVisible();
  await expect(page.getByText('₹12.50')).toBeVisible();
});
