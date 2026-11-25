import { expect, test } from '@playwright/test';

test('protected portal pages require sign-in', async ({ page }) => {
  await page.goto('/admin/dashboard.html');

  await expect(page).toHaveURL(/\/login\.html\?returnTo=/);
  await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();
});

test('signed-out navigation contains only public links', async ({ page }) => {
  await page.goto('/index.html');

  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: 'How it works' }))
    .toHaveAttribute('href', '/index.html#how-it-works');
  await expect(nav.getByRole('link', { name: 'For businesses' }))
    .toHaveAttribute('href', '/index.html#for-businesses');
  await expect(nav.getByRole('link', { name: 'About us' })).toHaveAttribute('href', '/about.html');
  await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact.html');
  await expect(nav.getByRole('link', { name: 'Search' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Map' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Create account' })).toBeVisible();
  await expect(page.locator('#site-footer a[href="/supplier/dashboard.html"]')).toHaveCount(1);
  await expect(page.locator('#site-footer a[href="/medical-shop/dashboard.html"]')).toHaveCount(1);
  await expect(page.locator('#site-footer a[href="/admin/dashboard.html"]')).toHaveCount(1);
  await expect(nav.getByRole('link', { name: 'Approvals' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Catalogue' })).toHaveCount(0);
});

test('footer highlights the Codexe Technologies website credit', async ({ page }) => {
  await page.goto('/contact.html');

  const credit = page.locator('#site-footer .footer-credit');
  await expect(credit).toContainText('Design and developed by');
  const link = credit.getByRole('link', { name: 'Codexe Technologies' });
  await expect(link).toHaveAttribute('href', 'https://codexe.in');
  const fontWeight = await link.locator('strong').evaluate((element) => getComputedStyle(element).fontWeight);
  expect(Number(fontWeight)).toBeGreaterThanOrEqual(700);
  const backgroundColor = await link.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('public content pages show a consistent decorative heading icon', async ({ page }) => {
  const paths = [
    '/about.html',
    '/contact.html',
    '/comparison-results.html',
    '/search.html',
    '/supplier-registration.html',
    '/medical-shop-registration.html',
    '/privacy-policy.html',
    '/terms.html'
  ];

  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator('main .page-title-icon'), path).toBeVisible();
    await expect(page.locator('main .page-title-icon'), path).toHaveAttribute('aria-hidden', 'true');
  }
});

const authenticatedHomeRoles = [
  {
    role: 'admin',
    menuLinks: ['Accounts', 'Approvals', 'KYC review', 'Revenue', 'Plans', 'Audit log']
  },
  {
    role: 'supplier',
    menuLinks: ['Catalogue', 'Enquiries', 'KYC documents', 'Plans']
  },
  {
    role: 'medical_shop',
    menuLinks: ['KYC documents', 'Plans']
  }
] as const;

for (const { role, menuLinks } of authenticatedHomeRoles) {
  test(`authenticated ${role} homepage shows only the dashboard link alongside public navigation`, async ({ page }) => {
    await page.route('**/api/auth/session', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { fullName: 'Test User', role } })
    }));
    await page.goto('/index.html');

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
    for (const label of menuLinks) {
      await expect(nav.getByRole('link', { name: label })).toHaveCount(0);
    }
    await expect(nav.getByRole('link', { name: 'How it works' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'For businesses' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Map' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Search' })).toHaveCount(0);
    await expect(nav.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
}

test('admin desktop navigation stays aligned on one row without overlapping the brand', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { fullName: 'Test Admin', role: 'admin' } })
  }));
  await page.goto('/search.html');

  const layout = await page.evaluate(() => {
    const brand = document.querySelector('.site-header .brand');
    const nav = document.querySelector<HTMLElement>('#primary-navigation');
    const firstLink = nav?.querySelector('a');
    if (!brand || !nav || !firstLink) throw new Error('Authenticated navigation did not render.');
    const items = [...nav.children];
    const itemTops = items.map((item) => Math.round(item.getBoundingClientRect().top));
    const itemGaps = items.slice(1).map((item, index) =>
      Math.round(item.getBoundingClientRect().left - items[index].getBoundingClientRect().right)
    );
    return {
      brandRight: brand.getBoundingClientRect().right,
      firstLinkLeft: firstLink.getBoundingClientRect().left,
      hasMultipleRows: new Set(itemTops).size > 1,
      minimumItemGap: Math.min(...itemGaps),
      hasHorizontalOverflow: nav.scrollWidth > nav.clientWidth
    };
  });

  expect(layout.firstLinkLeft).toBeGreaterThanOrEqual(layout.brandRight);
  expect(layout.hasMultipleRows).toBe(false);
  expect(layout.minimumItemGap).toBeGreaterThanOrEqual(4);
  expect(layout.hasHorizontalOverflow).toBe(false);
});

test('admin navigation stays the same on every admin page', async ({ page }) => {
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
      activeSuppliers: 0,
      activeMedicalShops: 0,
      totalListings: 0,
      totalEnquiries: 0,
      activeSubscriptions: 0,
      currentMonthRevenue: 0,
      pendingRenewals: 0,
      monthlyRevenue: []
    })
  }));
  await page.route('**/api/admin/subscriptions', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]'
  }));
  await page.route('**/api/admin/kyc/pending', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]'
  }));
  await page.route('**/api/admin/audit-logs', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]'
  }));

  const expectedLinks = [
    ['/admin/dashboard.html', 'Overview'],
    ['/admin/accounts.html', 'Accounts'],
    ['/admin/approvals.html', 'Approvals'],
    ['/admin/kyc.html', 'KYC review'],
    ['/admin/revenue.html', 'Revenue'],
    ['/admin/subscriptions.html', 'Plans'],
    ['/admin/audit.html', 'Audit log'],
    ['/search.html', 'Search'],
    ['/map.html', 'Map']
  ];

  for (const [path, heading] of [
    ['/admin/dashboard.html', 'Platform overview'],
    ['/admin/accounts.html', 'Account management'],
    ['/admin/approvals.html', 'Pending account approvals'],
    ['/admin/kyc.html', 'KYC document review'],
    ['/admin/revenue.html', 'Settled payment reporting'],
    ['/admin/subscriptions.html', 'Subscription plans'],
    ['/admin/audit.html', 'Admin audit log']
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.locator('main .page-title-icon')).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    for (const [href, label] of expectedLinks) {
      await expect(nav.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
    await expect(nav.getByRole('button', { name: 'Sign out' })).toBeVisible();
  }
});

test('cached admin navigation stays in place while the session is verified', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('connect-pharma-role', 'admin');
  });
  let sessionResolved = false;
  let resolveSession: (() => void) | undefined;
  const sessionGate = new Promise<void>((resolve) => {
    resolveSession = resolve;
  });
  await page.route('**/api/auth/session', async (route) => {
    await sessionGate;
    sessionResolved = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { fullName: 'Test Admin', role: 'admin' } })
    });
  });
  await page.route('**/api/admin/accounts/pending', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]'
  }));
  await page.route('**/api/admin/revenue', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      activeSuppliers: 0,
      activeMedicalShops: 0,
      totalListings: 0,
      totalEnquiries: 0,
      activeSubscriptions: 0,
      currentMonthRevenue: 0,
      pendingRenewals: 0,
      monthlyRevenue: []
    })
  }));

  const sessionResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/auth/session')
  );
  await page.goto('/admin/dashboard.html');

  const nav = page.locator('#primary-navigation');
  await expect(nav.getByRole('link', { name: 'Accounts' })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Sign out' })).toBeVisible();
  expect(sessionResolved).toBe(false);
  await nav.evaluate((element) => element.setAttribute('data-nav-instance', 'cached'));

  resolveSession?.();
  await sessionResponse;

  await expect(nav).toHaveAttribute('data-nav-instance', 'cached');
  await expect(nav.getByRole('link', { name: 'KYC review' })).toBeVisible();
});

test('signing out clears the cached role before public navigation is rendered', async ({ page }) => {
  let signedIn = true;
  await page.route('**/api/auth/session', (route) => route.fulfill(signedIn
    ? {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { fullName: 'Test Admin', role: 'admin' } })
    }
    : { status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Please sign in.' }) }
  ));
  await page.route('**/api/auth/logout', async (route) => {
    signedIn = false;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });

  await page.goto('/admin/dashboard.html');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login\.html$/);
  expect(await page.evaluate(() => sessionStorage.getItem('connect-pharma-role'))).toBeNull();

  await page.goto('/search.html');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Approvals' })).toHaveCount(0);
});
