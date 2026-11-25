import { expect, test } from '@playwright/test';

test('shows the English B2B hero and introduces the brand story before how it works', async ({ page }) => {
  await page.goto('/');

  const bodyFont = await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily);
  expect(bodyFont).toContain('Inter Variable');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Connecting the Entire Pharmaceutical Business Ecosystem Through One Platform.'
  );
  await expect(page.locator('.hero-landing .pill')).toContainText(
    'THE CONNECT PHARMA • B2B PHARMA NETWORK'
  );
  await expect(page.locator('.hero-landing .sub')).toContainText(
    'To become a trusted digital business network for the pharmaceutical industry.'
  );
  await expect(page.locator('.hero-landing .hero-pillars')).toHaveCount(0);
  const pillars = page.locator('.hero-pillars-section');
  await expect(pillars).toContainText('COMPARE');
  await expect(pillars).toContainText('CONNECT');
  await expect(pillars).toContainText('GROW');
  await expect(page.getByRole('link', { name: 'Explore Medicine Search' })).toHaveAttribute('href', '/search.html');
  await expect(page.getByRole('link', { name: 'Register Your Business', exact: true })).toHaveAttribute(
    'href',
    '/login.html?mode=signup'
  );
  await expect(page.locator('.hero-trust-bar')).toContainText('B2B pharmaceutical businesses');
  await expect(page.locator('.hero-trust-bar')).toContainText('Drug Licence & GST document review');
  await expect(page.locator('.hero-trust-note')).toContainText('not a licence, GST or regulatory verification');
  await expect(page.getByText('Example comparison')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paracetamol 650 mg Tablet' })).toBeVisible();
  await expect(page.getByText('3 illustrative supplier offers')).toBeVisible();
  await expect(page.getByText('₹18.40')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our Vision, Mission & Brand Story' })).toBeVisible();
  await expect(page.getByText('The Connect Pharma is more than just a name.')).toBeVisible();
  await expect(page.locator('.brand-name-meaning')).toHaveCount(0);
  await expect(page.locator('.brand-meaning')).toHaveCount(0);
  await expect(page.locator('.brand-color-psychology')).toHaveCount(0);
  await expect(page.locator('[data-brand-loop]')).toHaveCount(0);
  const sectionOrder = await page.locator('main').evaluate((main) => {
    const hero = main.querySelector('.hero-landing');
    const pillars = main.querySelector('.hero-pillars-section');
    const story = main.querySelector('.brand-story-section');
    const howItWorks = main.querySelector('#how-it-works');
    return Boolean(hero && pillars && story && howItWorks &&
      hero.compareDocumentPosition(pillars) & Node.DOCUMENT_POSITION_FOLLOWING &&
      pillars.compareDocumentPosition(story) & Node.DOCUMENT_POSITION_FOLLOWING &&
      story.compareDocumentPosition(howItWorks) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(sectionOrder).toBe(true);
  await expect(page.getByRole('heading', { name: 'How the platform works' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Switch language|மொழியை/ })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/மருந்து|வணக்கம்/);

  await page.goto('/about.html');
  await expect(page.getByRole('heading', { name: 'Connecting Pharmaceutical Businesses' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What Our Brand & Logo Stand For' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Brand Color Psychology' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our Core Values' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'B2B Business & Regulatory Responsibilities' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('under construction');
});

test('keeps the landing hero heading within the mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const hero = await page.locator('.hero-landing').boundingBox();
  const heading = await page.getByRole('heading', { level: 1 }).boundingBox();

  if (!hero || !heading) {
    throw new Error('The landing hero and heading must be visible.');
  }

  expect(heading.x).toBeGreaterThanOrEqual(hero.x);
  expect(heading.x + heading.width).toBeLessThanOrEqual(hero.x + hero.width);
  await expect(page.getByRole('heading', { name: 'Paracetamol 650 mg Tablet' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('all 15 required pages are present and linked from the shared footer', async ({ page }) => {
  const requiredPages = [
    ['/index.html', 'Connecting the Entire Pharmaceutical Business Ecosystem'],
    ['/about.html', 'Our Brand Story'],
    ['/supplier-registration.html', 'Supplier registration'],
    ['/medical-shop-registration.html', 'Medical shop registration'],
    ['/login.html', 'Sign in to your account'],
    ['/search.html', 'Paracetamol 650 mg Tablet'],
    ['/comparison-results.html', 'Price Comparison Results'],
    ['/supplier/dashboard.html', 'Distributor dashboard'],
    ['/medical-shop/dashboard.html', 'Retailer dashboard'],
    ['/subscription-plans.html', 'Subscription plans'],
    ['/payment.html', 'Payment'],
    ['/admin/dashboard.html', 'Platform overview'],
    ['/contact.html', 'Contact'],
    ['/terms.html', 'Terms &amp; Conditions'],
    ['/privacy-policy.html', 'Privacy Policy']
  ];

  for (const [path, content] of requiredPages) {
    const response = await page.request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text(), path).toContain(content);
  }

  await page.goto('/');
  for (const [path] of requiredPages) {
    expect(await page.locator(`#site-footer a[href="${path}"]`).count(), path).toBeGreaterThan(0);
  }
});
