import { expect, test, type Page } from '@playwright/test';

async function authenticateAs(page: Page, role: string): Promise<void> {
  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { fullName: 'Test User', role } })
  }));
}

test('admin account approval requires and audits a reason', async ({ page }) => {
  await authenticateAs(page, 'admin');
  await page.setViewportSize({ width: 390, height: 844 });
  let submittedReason = '';
  let approved = false;
  await page.route('**/api/admin/accounts/pending', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(approved ? [] : [{
      id: 'b3e1898e-f3ef-4791-9c2c-c543adb2cf52',
      fullName: 'Test Supplier',
      email: 'supplier@example.test',
      role: 'supplier',
      emailVerified: true,
      createdAt: '2026-01-01T00:00:00Z'
    }])
  }));
  await page.route('**/api/admin/accounts/b3e1898e-f3ef-4791-9c2c-c543adb2cf52/approve', async (route) => {
    submittedReason = route.request().postDataJSON().reason;
    approved = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ approved: true })
    });
  });

  await page.goto('/admin/approvals.html');
  const reasonInput = page.getByLabel('Approval reason');
  await page.getByRole('button', { name: 'Approve account' }).click();
  await expect(reasonInput).toBeFocused();
  expect(submittedReason).toBe('');

  await reasonInput.fill('Verified registration and required business details');
  await page.getByRole('button', { name: 'Approve account' }).click();

  await expect(page.getByRole('status')).toContainText('Account access approved.');
  expect(submittedReason).toBe('Verified registration and required business details');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('admin can suspend an approved account with an audited reason', async ({ page }) => {
  await authenticateAs(page, 'admin');
  await page.setViewportSize({ width: 390, height: 844 });
  let accountStatus = 'approved';
  let submittedReason = '';
  await page.route('**/api/admin/accounts**', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      submittedReason = body.reason;
      accountStatus = body.status;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: accountStatus })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(accountStatus === 'approved' ? [{
        id: 'b3e1898e-f3ef-4791-9c2c-c543adb2cf52',
        fullName: 'Test Supplier',
        email: 'supplier@example.test',
        role: 'supplier',
        status: accountStatus,
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00Z'
      }] : [])
    });
  });

  await page.goto('/admin/accounts.html');
  await page.getByLabel('Suspension reason').fill('Repeated policy violations');
  await page.getByRole('button', { name: 'Suspend' }).click();

  await expect(page.getByRole('status')).toContainText('Account status changed to suspended');
  expect(submittedReason).toBe('Repeated policy violations');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('admin can confirm account deletion with an audited reason', async ({ page }) => {
  await authenticateAs(page, 'admin');
  let deleted = false;
  let submittedReason = '';
  await page.route('**/api/admin/accounts**', async (route) => {
    if (route.request().method() === 'POST' && route.request().url().endsWith('/delete')) {
      submittedReason = route.request().postDataJSON().reason;
      deleted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deleted: true })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(deleted ? [] : [{
        id: 'b3e1898e-f3ef-4791-9c2c-c543adb2cf52',
        fullName: 'Test Supplier',
        email: 'supplier@example.test',
        role: 'supplier',
        status: 'approved',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00Z'
      }])
    });
  });
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/admin/accounts.html');
  await page.getByLabel('Deletion reason').fill('Supplier requested account closure');
  await page.getByRole('button', { name: 'Delete account' }).click();

  await expect(page.getByRole('status')).toContainText('Account and KYC documents deleted');
  await expect(page.getByText('No accounts found')).toBeVisible();
  expect(submittedReason).toBe('Supplier requested account closure');
});

test('map page keeps supplier coverage readable without a configured map key', async ({ page }) => {
  await authenticateAs(page, 'medical_shop');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/config', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ googleMapsApiKey: '' })
  }));
  await page.route('**/api/map/suppliers', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{
      id: 'a1f8d19b-7043-42d7-a8c0-7da250962b03',
      name: 'Astra Pharma Distributors',
      city: 'Madurai',
      stock: 'In Stock',
      deliveryRadiusKm: 25,
      coordinates: { lat: 9.939, lng: 78.1445 }
    }])
  }));

  await page.goto('/map.html');

  await expect(page.getByRole('heading', { name: 'Supplier coverage map' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Map preview is not configured' })).toBeVisible();
  await expect(page.getByText('1 supplier')).toBeVisible();
  await expect(page.getByRole('button', { name: /Astra Pharma Distributors/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fit all suppliers' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('admin can create a subscription plan', async ({ page }) => {
  await authenticateAs(page, 'admin');
  let createdPlan: Record<string, unknown> | null = null;
  await page.route('**/api/admin/subscriptions', async (route) => {
    if (route.request().method() === 'POST') {
      createdPlan = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'c1eb382a-0c8b-4ce8-84cf-dc46a522f136',
          ...(createdPlan as object),
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z'
        })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: createdPlan ? JSON.stringify([{
        id: 'c1eb382a-0c8b-4ce8-84cf-dc46a522f136',
        ...createdPlan,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }]) : '[]'
    });
  });

  await page.goto('/admin/subscriptions.html');
  await page.getByLabel('Plan name').fill('Retail Plus');
  await page.getByLabel('SKU limit').fill('250');
  await page.getByLabel('Monthly fee (INR)').fill('1499');
  await page.getByLabel('Features (one per line)').fill('Priority support\nCatalog analytics');
  await page.getByRole('button', { name: 'Create plan' }).click();

  await expect(page.getByRole('status')).toContainText('Plan created.');
  await expect(page.getByRole('heading', { name: 'Retail Plus' })).toBeVisible();
  expect(createdPlan).toMatchObject({
    tier: 'Retail Plus',
    skuLimit: 250,
    monthlyFee: 1499,
    features: ['Priority support', 'Catalog analytics'],
    isActive: true
  });
});

test('supplier uploads a private KYC document and submits it for review', async ({ page }) => {
  await authenticateAs(page, 'supplier');
  let submitted = false;
  await page.route('**/api/kyc/documents**', async (route) => {
    const request = route.request();
    if (request.method() === 'POST' && request.url().endsWith('/api/kyc/documents')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ documentId: '4c4bf0de-e8b2-48f8-94a2-fcc4529d00c7' })
      });
      return;
    }
    if (request.method() === 'PUT') {
      submitted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ submitted: true })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(submitted ? [{
        id: '4c4bf0de-e8b2-48f8-94a2-fcc4529d00c7',
        documentType: 'wholesale_license',
        status: 'pending_review',
        createdAt: '2026-01-01T00:00:00Z'
      }] : [])
    });
  });

  await page.goto('/kyc.html');
  await page.getByLabel('Choose a file').setInputFiles({
    name: 'license.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 test')
  });
  await page.getByRole('button', { name: 'Upload for review' }).click();

  await expect(page.getByRole('status')).toContainText('sent for admin review');
  await expect(page.getByText('pending review')).toBeVisible();
});

test('admin can reject a KYC document with a recorded reason', async ({ page }) => {
  await authenticateAs(page, 'admin');
  let reviewed = false;
  await page.route('**/api/admin/kyc/pending', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(reviewed ? [] : [{
      id: '36a5e5ea-0a25-4fc7-b8d0-5337b46bc412',
      documentType: 'wholesale_license',
      mimeType: 'application/pdf',
      createdAt: '2026-01-01T00:00:00Z',
      fullName: 'Test Supplier',
      email: 'supplier@example.test',
      role: 'supplier'
    }])
  }));
  await page.route('**/api/admin/kyc/36a5e5ea-0a25-4fc7-b8d0-5337b46bc412/review', async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      status: 'rejected',
      reason: 'Licence image is unreadable'
    });
    reviewed = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reviewed: true })
    });
  });

  await page.goto('/admin/kyc.html');
  await page.getByLabel('Review reason').fill('Licence image is unreadable');
  await page.getByRole('button', { name: 'Reject document' }).click();

  await expect(page.getByRole('status')).toContainText('Document rejected');
  await expect(page.getByText('No documents are waiting for review.')).toBeVisible();
});

test('supplier checkout opens Cashfree with the selected plan and contact phone', async ({ page }) => {
  await authenticateAs(page, 'supplier');
  let orderBody: Record<string, unknown> | null = null;
  await page.route('**/api/billing/plans', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{
      id: '59a92ac4-25b8-4aeb-8689-0decda6a13c6',
      tier: 'Standard',
      skuLimit: 500,
      monthlyFee: '1999.00',
      features: ['Priority support']
    }])
  }));
  await page.route('**/api/billing/subscription', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: 'null'
  }));
  await page.route('**/api/billing/orders', async (route) => {
    orderBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        orderId: 'cp_test',
        paymentSessionId: 'session_test',
        mode: 'sandbox'
      })
    });
  });
  await page.route('https://sdk.cashfree.com/js/v3/cashfree.js', (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: `window.Cashfree = ({ mode }) => ({
      checkout: async ({ paymentSessionId }) => {
        document.body.dataset.checkout = mode + ':' + paymentSessionId;
      }
    });`
  }));

  await page.goto('/subscription-plans.html');
  await page.getByLabel('Contact phone for checkout').fill('9876543210');
  await page.getByRole('button', { name: 'Continue to payment' }).click();

  await expect(page.locator('body')).toHaveAttribute('data-checkout', 'sandbox:session_test');
  expect(orderBody).toMatchObject({
    planId: '59a92ac4-25b8-4aeb-8689-0decda6a13c6',
    customerPhone: '9876543210'
  });
});
