import { expect, test } from '@playwright/test';

test('admin overview shows live account counts and admin tools', async ({ page }) => {
  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { fullName: 'Test Admin', role: 'admin' } })
  }));
  await page.route('**/api/admin/accounts/pending', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 'pending-1',
        fullName: 'Pending Supplier',
        email: 'supplier@example.test',
        role: 'supplier',
        emailVerified: true
      }
    ])
  }));
  await page.route('**/api/admin/revenue', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      activeSuppliers: 12,
      activeMedicalShops: 30,
      totalListings: 400,
      totalEnquiries: 50,
      activeSubscriptions: 8,
      currentMonthRevenue: 12000
    })
  }));

  await page.goto('/admin/dashboard.html');

  await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible();
  await expect(page.locator('#pending-count')).toHaveText('1');
  await expect(page.locator('#supplier-count')).toHaveText('12');
  await expect(page.locator('#shop-count')).toHaveText('30');
  await expect(page.locator('#listing-count')).toHaveText('400');
  await expect(page.locator('#enquiry-count')).toHaveText('50');
  await expect(page.locator('#subscription-count')).toHaveText('8');
  await expect(page.locator('#revenue-estimate')).toContainText('12,000');
  await expect(page.getByText('Pending Supplier')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Admin tools' }).getByRole('link')).toHaveCount(7);
});

test('admin overview keeps available metrics visible when billing migration is pending', async ({ page }) => {
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
  await page.route('**/api/admin/revenue', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      activeSuppliers: 12,
      activeMedicalShops: 30,
      totalListings: 400,
      totalEnquiries: 50,
      activeSubscriptions: 8,
      currentMonthRevenue: null,
      billingSchemaAvailable: false
    })
  }));

  await page.goto('/admin/dashboard.html');

  await expect(page.locator('#supplier-count')).toHaveText('12');
  await expect(page.locator('#revenue-estimate')).toHaveText('Unavailable');
  await expect(page.getByRole('status')).toContainText('database migration 0003');
  await expect(page.getByRole('alert')).toBeHidden();
});
