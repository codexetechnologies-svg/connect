import { expect, test } from '@playwright/test';

test('medical shop can send an enquiry for a supplier offer', async ({ page }) => {
  let submittedEnquiry: unknown;

  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { fullName: 'Test Medical Shop', role: 'medical_shop' } })
  }));
  await page.route('**/api/search**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{
      id: '89b1de52-a264-462d-b98d-4c8fdb5cf233',
      name: 'Test Supplier',
      distanceKm: 0,
      stock: 'In Stock',
      price: 18,
      gst: 12,
      scheme: 'N/A',
      verified: true,
      brand: 'Generic',
      pack: 'Strip of 10'
    }])
  }));
  await page.route('**/api/enquiries', async (route) => {
    submittedEnquiry = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: '8e3f8d13-92be-4bdb-b7a4-d1d834dd30c5', status: 'new' })
    });
  });

  await page.goto('/search.html');
  await page.getByRole('button', { name: 'Enquire' }).click();
  await page.getByLabel('Quantity').fill('12');
  await page.getByLabel('Message (optional)').fill('Please confirm the delivery date.');
  await page.getByRole('button', { name: 'Send enquiry' }).click();

  await expect(page.locator('#enquiry-note')).toContainText('Enquiry sent to Test Supplier.');
  expect(submittedEnquiry).toEqual({
    listingId: '89b1de52-a264-462d-b98d-4c8fdb5cf233',
    quantity: 12,
    message: 'Please confirm the delivery date.'
  });
});
