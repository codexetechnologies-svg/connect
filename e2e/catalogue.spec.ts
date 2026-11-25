import { expect, test, type Page } from '@playwright/test';

const listing = {
  id: '11111111-2222-4333-8444-555555555555',
  medicineId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
  medicineName: 'Paracetamol 500mg',
  genericName: 'Paracetamol',
  brandName: 'Crocin',
  manufacturer: 'GSK',
  strength: '500mg',
  dosageForm: 'Tablet',
  packSize: 'Strip of 15',
  mrp: 34.5,
  wholesalePrice: 30,
  gstPercentage: 12,
  schemes: '5% off',
  batchNumber: 'B123',
  batchExpiryDate: '2028-01-31',
  stockStatus: 'in_stock',
  isActive: true,
  lastUpdatedAt: '2026-01-01T00:00:00.000Z'
};

async function mockSupplier(page: Page) {
  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { fullName: 'Test Supplier', role: 'supplier' } })
  }));
  await page.route('**/api/supplier/catalogue/usage', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ activeSkus: 1, skuLimit: 100, tier: 'Basic' })
  }));
}

test('renders persisted catalogue rows and SKU usage', async ({ page }) => {
  await mockSupplier(page);
  await page.route('**/api/supplier/catalogue', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([listing])
    });
  });

  await page.goto('/supplier/catalogue.html');

  await expect(page.locator('#sku-usage')).toContainText('1 of 100 active SKUs used');
  await expect(page.getByText('Paracetamol 500mg')).toBeVisible();
  await expect(page.getByText('Crocin')).toBeVisible();
  await expect(page.getByText('₹34.50')).toBeVisible();
});

test('add product form posts to the catalogue API', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await mockSupplier(page);
  await page.route('**/api/supplier/catalogue', async (route) => {
    if (route.request().method() === 'POST') {
      submitted = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'new-id', medicineId: 'med-id', isActive: true })
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([listing])
    });
  });

  await page.goto('/supplier/catalogue.html');
  await page.getByRole('button', { name: 'Add product' }).click();
  await page.getByLabel(/Product name/).fill('Amoxicillin 250mg');
  await page.getByLabel(/Manufacturer/).fill('Cipla');
  await page.getByLabel(/Composition \/ Salt/).fill('Amoxicillin Trihydrate');
  await page.getByLabel(/^Strength/).fill('250mg');
  await page.getByLabel(/Dosage form/).fill('Capsule');
  await page.getByLabel(/Pack size/).fill('Strip of 10');
  await page.getByLabel(/MRP/).fill('120');
  await page.getByLabel(/Selling price/).fill('100');
  await page.getByLabel(/Batch number/).fill('AMX-1');
  await page.getByLabel(/Expiry date/).fill('2029-06-30');
  await page.getByRole('button', { name: 'Save product' }).click();

  await expect(page.locator('#import-msg')).toContainText('Product saved');
  expect(submitted).toMatchObject({
    medicineName: 'Amoxicillin 250mg',
    manufacturer: 'Cipla',
    composition: 'Amoxicillin Trihydrate',
    strength: '250mg',
    dosageForm: 'Capsule',
    packSize: 'Strip of 10',
    mrp: '120',
    sellingPrice: '100',
    batchNumber: 'AMX-1',
    batchExpiryDate: '2029-06-30'
  });
});

test('CSV import posts parsed rows to the import endpoint', async ({ page }) => {
  let imported: { items?: Record<string, unknown>[] } | undefined;
  await mockSupplier(page);
  await page.route('**/api/supplier/catalogue', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([])
  }));
  await page.route('**/api/supplier/catalogue/import', async (route) => {
    imported = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ created: 1, failed: 0, results: [{ row: 2, id: 'x' }], errors: [], skuLimit: 100, tier: 'Basic' })
    });
  });

  await page.goto('/supplier/catalogue.html');
  await page.locator('#csv').setInputFiles({
    name: 'catalogue.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'Product name,Manufacturer,Composition,Strength,Dosage form,Pack size,MRP,Selling price,GST %,Batch,Expiry\n' +
      'Paracetamol 500mg,GSK,Paracetamol,500mg,Tablet,Strip of 15,34.5,30,12,B123,31/01/2028'
    )
  });

  await expect(page.locator('#import-msg')).toContainText('Imported 1 product');
  expect(imported?.items).toHaveLength(1);
  expect(imported?.items?.[0]).toMatchObject({
    medicineName: 'Paracetamol 500mg',
    composition: 'Paracetamol',
    sellingPrice: '30',
    batchExpiryDate: '2028-01-31'
  });
});
