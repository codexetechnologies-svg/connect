import { expect, test } from '@playwright/test';
import { authenticateAs } from './auth-session';

test('map shows setup guidance and usable external location links without an API key', async ({ page }) => {
  await authenticateAs(page, 'medical-shop');
  await page.goto('/map');

  await expect(page.getByRole('heading', { name: 'Google Maps API key required' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fit all suppliers' })).toBeDisabled();
  const supplierLocation = page.getByRole('link', { name: /Astra Pharma Distributors/ });
  await expect(supplierLocation).toHaveAttribute(
    'href',
    'https://www.google.com/maps/search/?api=1&query=9.939,78.1445'
  );
});
