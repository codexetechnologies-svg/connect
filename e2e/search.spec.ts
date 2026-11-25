import { expect, test } from '@playwright/test';

const offers = [
  {
    id: 'offer-1', medicineName: 'Amlodipine 5mg', name: 'Astra Pharma Distributors',
    supplierName: 'Astra Pharma Distributors', composition: 'Amlodipine Besylate',
    strength: '5mg', dosageForm: 'Tablet', pack: 'Strip of 10', brand: 'Generic',
    price: 10.91, mrp: 13.09, gst: 12, scheme: '10+1', netPrice: 9.92,
    stock: 'In Stock', distanceKm: 5, verified: true
  },
  {
    id: 'offer-2', medicineName: 'Amlodipine 5mg', name: 'Bharat Labs',
    supplierName: 'Bharat Labs', composition: 'Amlodipine Besylate',
    strength: '5mg', dosageForm: 'Tablet', pack: 'Strip of 15', brand: 'Amlopres',
    price: 20.59, mrp: 24.71, gst: 12, scheme: 'N/A', netPrice: 20.59,
    stock: 'In Stock', distanceKm: 12, verified: true
  },
  {
    id: 'offer-3', medicineName: 'Amlodipine 5mg', name: 'Far Supplier',
    supplierName: 'Far Supplier', composition: 'Amlodipine Besylate',
    strength: '5mg', dosageForm: 'Tablet', pack: 'Strip of 10', brand: 'Generic',
    price: 8, mrp: 10, gst: 12, scheme: 'N/A', netPrice: 8,
    stock: 'In Stock', distanceKm: 80, verified: true
  }
];

test('filters wholesale offers and applies the comparison', async ({ page }) => {
  await page.route('**/api/search**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(offers)
  }));

  await page.goto('/search.html');
  await expect(page.getByText('2 suppliers found')).toBeVisible();
  await expect(page.getByText('Astra Pharma Distributors')).toBeVisible();
  await expect(page.getByText('Far Supplier')).toHaveCount(0);

  await page.getByLabel('Brand / generic').selectOption('generic');
  await expect(page.getByText('1 supplier found')).toBeVisible();
  await expect(page.getByText('Astra Pharma Distributors')).toBeVisible();
  await expect(page.getByText('Bharat Labs')).toHaveCount(0);

  await page.getByRole('button', { name: 'Compare suppliers' }).click();
  await expect(page.locator('#compare-note')).toContainText('Comparison updated');

  await page.getByLabel('Pack size').selectOption('Strip of 15');
  await expect(page.getByText('No suppliers match those filters.')).toBeVisible();
  await page.getByLabel('Brand / generic').selectOption('all');
  await expect(page.getByText('1 supplier found')).toBeVisible();
});
