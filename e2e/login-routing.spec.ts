import { expect, test, type Page } from '@playwright/test';

type AccountRole = 'admin' | 'supplier' | 'medical_shop';

const roleCases: Array<{
  role: AccountRole;
  dashboard: string;
  roleLink: string;
  hiddenLink: string;
}> = [
  {
    role: 'admin',
    dashboard: '/admin/dashboard.html',
    roleLink: 'Approvals',
    hiddenLink: 'Catalogue'
  },
  {
    role: 'supplier',
    dashboard: '/supplier/dashboard.html',
    roleLink: 'Catalogue',
    hiddenLink: 'Approvals'
  },
  {
    role: 'medical_shop',
    dashboard: '/medical-shop/dashboard.html',
    roleLink: 'Search',
    hiddenLink: 'Enquiries'
  }
];

async function mockAuthenticatedRole(page: Page, role: AccountRole): Promise<void> {
  const response = {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { fullName: 'Test User', role } })
  };
  await page.route('**/api/auth/login', (route) => route.fulfill(response));
  await page.route('**/api/auth/session', (route) => route.fulfill(response));
  await page.route('**/api/search**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]'
  }));
}

for (const { role, dashboard, roleLink, hiddenLink } of roleCases) {
  test(`${role} sign-in opens the matching portal and navigation`, async ({ page }) => {
    await mockAuthenticatedRole(page, role);
    await page.goto('/login.html');
    await page.locator('#email').fill('test@example.test');
    await page.locator('#password').fill('test-password');

    const navigation = page.waitForURL((url) => url.pathname === dashboard);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await navigation;
    await expect(page.locator('main .page-title-icon')).toBeVisible();

    const nav = page.locator('#primary-navigation');
    await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', dashboard);
    await expect(nav.getByRole('link', { name: roleLink })).toBeVisible();
    await expect(nav.getByRole('link', { name: hiddenLink })).toHaveCount(0);
    await expect(nav.getByRole('button', { name: 'Sign out' })).toBeVisible();

    await page.goto('/search.html');
    await expect(page.locator('main .page-title-icon')).toBeVisible();
    const publicPageNav = page.locator('#primary-navigation');
    await expect(publicPageNav.getByRole('link', { name: roleLink })).toBeVisible();
    await expect(publicPageNav.getByRole('link', { name: hiddenLink })).toHaveCount(0);
    await expect(publicPageNav.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
}

test('anonymous public navigation links to sign-up', async ({ page }) => {
  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Not signed in.' })
  }));
  await page.goto('/search.html');

  await expect(page.locator('#primary-navigation').getByRole('link', { name: 'Create account' }))
    .toHaveAttribute('href', '/login.html?mode=signup');
});

test('an incompatible requested page falls back to the signed-in role dashboard', async ({ page }) => {
  await mockAuthenticatedRole(page, 'admin');
  await page.goto(`/login.html?returnTo=${encodeURIComponent('/supplier/enquiries.html')}`);
  await page.locator('#email').fill('test@example.test');
  await page.locator('#password').fill('test-password');

  const navigation = page.waitForURL((url) => url.pathname === '/admin/dashboard.html');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await navigation;
});

test('sign-up allocates the selected account type and displays the verification status', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/api/auth/signup', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Account created. Check your email to verify it; portal access is enabled after verification.'
      })
    });
  });

  await page.goto('/login.html?mode=signup&role=supplier');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expect(page.getByLabel('Distributor')).toBeChecked();
  await page.getByLabel('Your name').fill('Test Distributor');
  await page.locator('#signup-email').fill('distributor@example.test');
  await page.locator('#signup-phone').fill('+919876543210');
  await page.getByLabel('Create password').fill('safe-test-password');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('status')).toContainText('portal access is enabled after verification');
  expect(submitted).toEqual({
    fullName: 'Test Distributor',
    email: 'distributor@example.test',
    phone: '+919876543210',
    password: 'safe-test-password',
    role: 'supplier',
    consentAccepted: true
  });
  await expect(page.locator('#signup-form')).toBeHidden();
});

test('retailer registration maps to the medical shop database role', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/api/auth/signup', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Account request recorded.' })
    });
  });

  await page.goto('/login.html?mode=signup');
  await expect(page.getByLabel('Retailer')).toBeChecked();
  await page.getByLabel('Your name').fill('Test Retailer');
  await page.locator('#signup-email').fill('retailer@example.test');
  await page.getByLabel('Create password').fill('safe-test-password');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('status')).toContainText('Account request recorded');
  expect(submitted?.role).toBe('medical_shop');
});

test('signup confirmation sends the access token to the server and clears the URL fragment', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/api/auth/confirm-email', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ verified: true })
    });
  });

  await page.goto('/login.html#access_token=test-access-token&type=signup');

  await expect(page.getByRole('status')).toHaveText(
    'Email verified. You can sign in if your account is active.'
  );
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
  expect(submitted).toEqual({ accessToken: 'test-access-token' });
});

test('resends a verification email from the sign-in screen', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/api/auth/resend-verification', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'If this address has an unverified account, a verification email has been sent.' })
    });
  });

  await page.goto('/login.html');
  await page.locator('#email').fill('pending@example.test');
  await page.getByRole('button', { name: 'Resend verification email' }).click();
  await page.locator('#resend-email').fill('pending@example.test');
  await page.getByRole('button', { name: 'Send verification email', exact: true }).click();

  await expect(page.getByRole('status')).toContainText('a verification email has been sent');
  expect(submitted).toEqual({ email: 'pending@example.test' });
});

test('requests and completes a password reset', async ({ page }) => {
  let resetRequest: Record<string, unknown> | undefined;
  let passwordUpdate: Record<string, unknown> | undefined;
  await page.route('**/api/auth/password-reset', async (route) => {
    resetRequest = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'If an account exists for this address, a password reset email has been sent.' })
    });
  });
  await page.route('**/api/auth/update-password', async (route) => {
    passwordUpdate = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Your password has been updated. You can now sign in.' })
    });
  });

  await page.goto('/login.html');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await page.locator('#reset-email').fill('person@example.test');
  await page.getByRole('button', { name: 'Send password reset link' }).click();
  await expect(page.getByRole('status')).toContainText('password reset email has been sent');
  expect(resetRequest).toEqual({ email: 'person@example.test' });

  await page.goto('/login.html?mode=reset-password#access_token=recovery-test-token&type=recovery');
  await page.getByLabel('New password', { exact: true }).fill('new-safe-password');
  await page.getByLabel('Confirm new password').fill('new-safe-password');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByRole('status')).toContainText('password has been updated');
  expect(passwordUpdate).toEqual({ accessToken: 'recovery-test-token', password: 'new-safe-password' });
});

test('sign-in and sign-up benefit cards fit in one compact desktop row', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });

  for (const path of ['/login.html', '/login.html?mode=signup']) {
    await page.goto(path);
    const grid = page.locator('.auth-feature-grid');
    await expect(grid.locator('.auth-feature-card')).toHaveCount(3);
    const columnCount = await grid.evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(' ').length
    );
    expect(columnCount).toBe(3);
    const cardTops = await grid.locator('.auth-feature-card').evaluateAll((cards) =>
      cards.map((card) => Math.round(card.getBoundingClientRect().top))
    );
    expect(new Set(cardTops).size).toBe(1);
  }
});

test('sign-up raises the right-side content above its sign-in position', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/login.html');
  const signInTop = await page.locator('.auth-feature-content').evaluate((element) =>
    element.getBoundingClientRect().top
  );

  await page.goto('/login.html?mode=signup');
  const signUpTop = await page.locator('.auth-feature-content').evaluate((element) =>
    element.getBoundingClientRect().top
  );

  expect(signUpTop).toBeLessThan(140);
  expect(signUpTop).toBeLessThan(signInTop);
});

test('the generic dashboard redirects to the signed-in role dashboard', async ({ page }) => {
  await mockAuthenticatedRole(page, 'medical_shop');

  await page.goto('/dashboard.html');

  await expect(page).toHaveURL(/\/medical-shop\/dashboard\.html$/);
});

test('retailer dashboard links to existing shop workflows', async ({ page }) => {
  await mockAuthenticatedRole(page, 'medical_shop');
  await page.goto('/medical-shop/dashboard.html');

  const main = page.locator('main');
  await expect(main.getByRole('heading', { name: 'Retailer dashboard' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Open medicine search' }))
    .toHaveAttribute('href', '/search.html');
  await expect(main.getByRole('link', { name: 'Open supplier map' }))
    .toHaveAttribute('href', '/map.html');
  await expect(main.getByRole('link', { name: 'Manage KYC' })).toHaveAttribute('href', '/kyc.html');
  await expect(main.getByRole('link', { name: 'View plans' }))
    .toHaveAttribute('href', '/subscription-plans.html');
  await expect(main).not.toContainText('under construction');
});

test('distributor dashboard counts its existing catalogue and retailer enquiries', async ({ page }) => {
  await mockAuthenticatedRole(page, 'supplier');
  await page.route('**/api/supplier/catalogue', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { isActive: true, medicineId: 'medicine-one' },
      { isActive: false, medicineId: 'medicine-two' },
      { isActive: true, medicineId: 'medicine-two' },
      { isActive: true, medicineId: 'medicine-three' }
    ])
  }));
  await page.route('**/api/billing/subscription', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      tier: 'Growth',
      skuLimit: 500,
      status: 'active',
      endDate: '2026-12-24T00:00:00.000Z'
    })
  }));
  await page.route('**/api/supplier/enquiries', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { status: 'new' },
      { status: 'quoted' },
      { status: 'new' }
    ])
  }));
  await page.goto('/supplier/dashboard.html');

  await expect(page.getByRole('heading', { name: 'Distributor dashboard' })).toBeVisible();
  await expect(page.locator('#active-sku-count')).toHaveText('3');
  await expect(page.locator('#new-enquiry-count')).toHaveText('2');
  await expect(page.locator('#total-enquiry-count')).toHaveText('3');
  await expect(page.locator('#subscription-status')).toHaveText('Growth · active');
  await expect(page.locator('#subscription-renewal')).toContainText('plan limit 500 active SKUs');
  await expect(page.locator('#subscription-renewal')).toContainText('Renewal is manual.');
  await expect(page.getByRole('link', { name: 'Manage catalogue' }))
    .toHaveAttribute('href', '/supplier/catalogue.html');
  await expect(page.getByRole('link', { name: 'Review enquiries' }))
    .toHaveAttribute('href', '/supplier/enquiries.html');
});

test('distributor dashboard shows unavailable summaries when an existing API fails', async ({ page }) => {
  await mockAuthenticatedRole(page, 'supplier');
  await page.route('**/api/supplier/catalogue', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Catalogue service is unavailable.' })
  }));
  await page.route('**/api/supplier/enquiries', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]'
  }));
  await page.route('**/api/billing/subscription', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: 'null'
  }));
  await page.goto('/supplier/dashboard.html');

  await expect(page.locator('#active-sku-count')).toHaveText('Unavailable');
  await expect(page.locator('#new-enquiry-count')).toHaveText('0');
  await expect(page.locator('#total-enquiry-count')).toHaveText('0');
  await expect(page.getByRole('alert')).toContainText('Catalogue service is unavailable.');
});
