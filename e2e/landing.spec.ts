import { expect, test } from '@playwright/test';

test('switches landing-page copy between English and Tamil', async ({ page }) => {
  await page.goto('/');

  const bodyFont = await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily);
  expect(bodyFont).toContain('Inter Variable');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Compare Wholesale Medicine Prices Across Verified Suppliers.'
  );
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Medical shop search' })).toHaveAttribute(
    'href',
    '/search'
  );
  await expect(page.getByRole('heading', { name: 'How the platform works' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Built for every side of the supply chain' })).toBeVisible();
  await expect(page.getByText('From product search to supplier conversation')).toBeVisible();
  await expect(page.getByText(/not connected to live supplier feeds/)).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Phase 1 Live');
  await expect(page.locator('body')).not.toContainText('Admin & rollout');

  await page.getByRole('button', { name: 'மொழியை தமிழுக்கு மாற்றவும்' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('சரிபார்க்கப்பட்ட விநியோகஸ்தர்களின்');
  await expect(page.getByRole('heading', { name: 'தளம் எவ்வாறு செயல்படுகிறது' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'விநியோகச் சங்கிலியின் அனைவருக்கும்' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch language to English' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Compare Wholesale Medicine Prices Across Verified Suppliers.'
  );
});
