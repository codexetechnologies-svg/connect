import { expect, test } from '@playwright/test';

const plans = [
  { id: 'plan-1', tier: 'Basic', skuLimit: 100, monthlyFee: 999, features: ['100 SKUs'], isActive: true },
  { id: 'plan-2', tier: 'Standard', skuLimit: 500, monthlyFee: 1999, features: ['500 SKUs'], isActive: true }
];

test('admin subscription plans page lists plans and creates a new plan', async ({ page }) => {
  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { fullName: 'Test Admin', role: 'admin' } })
  }));
  let created: Record<string, unknown> | undefined;
  await page.route('**/api/admin/subscriptions**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(plans)
      });
    }
    created = request.postDataJSON();
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'plan-3', ...created })
    });
  });

  await page.goto('/admin/subscriptions.html');
  await expect(page.getByRole('heading', { name: 'Basic' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Standard' })).toBeVisible();

  await page.getByLabel('Plan name').fill('Enterprise');
  await page.getByLabel('SKU limit').fill('5000');
  await page.getByLabel('Monthly fee (INR)').fill('6999');
  await page.getByRole('button', { name: 'Create plan' }).click();

  await expect(page.locator('#plan-status')).toContainText('Plan created.');
  expect(created).toMatchObject({ tier: 'Enterprise', skuLimit: 5000, monthlyFee: 6999, isActive: true });
});
