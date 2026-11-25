import { expect, test } from '@playwright/test';

const lead = {
  id: 'enq-1',
  medicalShopId: 'shop-1',
  medicalShopName: 'Test Medical Shop',
  medicineId: 'med-1',
  medicineName: 'Paracetamol 500mg',
  quantity: 10,
  status: 'new',
  message: 'Need it by Friday',
  supplierResponse: null,
  createdAt: '2026-01-01T00:00:00.000Z'
};

test('supplier saves a quote response and exports the enquiry list', async ({ page }) => {
  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { fullName: 'Test Supplier', role: 'supplier' } })
  }));
  await page.route('**/api/supplier/enquiries', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([lead])
  }));
  let responseBody: unknown;
  await page.route('**/api/enquiries/enq-1/respond', async (route) => {
    responseBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'enq-1', status: 'quoted' })
    });
  });

  await page.goto('/supplier/enquiries.html');
  await expect(page.getByText('Test Medical Shop')).toBeVisible();

  await page.getByRole('button', { name: 'Respond' }).click();
  await page.getByLabel('Draft a quote response').fill('₹18 per strip; delivery in two days.');
  await page.getByRole('button', { name: 'Save response' }).click();
  await expect(page.locator('#notice')).toContainText('Response saved successfully.');
  expect(responseBody).toMatchObject({
    status: 'quoted',
    response: '₹18 per strip; delivery in two days.'
  });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export lead list' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('connect-pharma-leads.csv');
});
