// End-to-end verification against the real Express server + PostgreSQL DB.
// Creates temporary Supabase auth users (directly in auth.users, since the
// project's SMTP is not configured) and DB rows, exercises:
//   supplier login → add catalogue item → bulk import → SKU usage
//   → retailer login → live search → submit enquiry → both sides see it
// Cleans up all test data afterwards.
//
// Usage: node scripts/verify-e2e.mjs [baseUrl]   (default http://localhost:4000)

import { createSql } from './db.mjs';

const BASE = process.argv[2] || 'http://localhost:4000';
const sql = createSql();
const stamp = Date.now();
const supplierEmail = `e2e-supplier-${stamp}@example.com`;
const shopEmail = `e2e-shop-${stamp}@example.com`;
const password = `E2e!${stamp}xY`;
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function api(path, { method = 'GET', cookie = '', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE,
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const jar = setCookie.map((c) => c.split(';')[0]).join('; ');
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json, jar };
}

async function login(email) {
  const res = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.json)}`);
  return res.jar;
}

async function createAuthUser(email, fullName, role) {
  const [authRow] = await sql`
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      phone_change, phone_change_token, email_change_token_current,
      reauthentication_token,
      email_change_confirm_status, is_sso_user, is_anonymous,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
      'authenticated', 'authenticated', ${email}, crypt(${password}, gen_salt('bf')),
      now(),
      '', '', '', '', '', '', '', '', 0, false, false,
      ${sql.json({ provider: 'email', providers: ['email'] })},
      ${sql.json({ full_name: fullName, email_verified: true })},
      now(), now()
    )
    returning id
  `;
  const [row] = await sql`
    insert into users (role, email, full_name, status, email_verified, consent_accepted_at)
    values (${role}, ${email}, ${fullName}, 'approved', true, now())
    returning id
  `;
  return { authId: authRow.id, userId: row.id };
}

const MEDICINE = {
  medicineName: `E2E Testmol ${stamp}`,
  brandName: 'E2E Brand',
  manufacturer: 'E2E Pharma Ltd',
  composition: `E2ETestmol-${stamp}`,
  strength: '500mg',
  dosageForm: 'Tablet',
  packSize: 'Strip of 10',
  mrp: 120,
  sellingPrice: 100,
  gstPercentage: 12,
  schemes: '10% off',
  batchNumber: `E2E-${stamp}-A`,
  batchExpiryDate: '2028-12-31',
  stockStatus: 'in_stock',
  availableQuantity: 500,
  minimumOrderQuantity: 1
};

let supplier, shop, testPlanId;
try {
  // --- setup: auth users + DB rows -------------------------------------
  supplier = await createAuthUser(supplierEmail, 'E2E Supplier', 'supplier');
  shop = await createAuthUser(shopEmail, 'E2E Shop', 'medical_shop');
  await sql`
    insert into suppliers (user_id, business_name, proprietor_name, contact_person, address,
      district, pincode, wholesale_license_number, licence_type, licence_authority, licence_expiry)
    values (${supplier.userId}, 'E2E Distributors', 'E2E Prop', 'E2E Contact', '1 Test Street',
      'Chennai', '600001', 'WL-E2E-1', 'Wholesale', 'TN FDA', '2030-01-01')
  `;
  // Tiny plan so the SKU limit can be exercised with a few rows.
  const [plan] = await sql`
    insert into subscription_plans (tier, sku_limit, monthly_fee, is_active)
    values ('E2E-Test', 2, 0, true)
    on conflict (tier) do update set sku_limit = 2
    returning id
  `;
  testPlanId = plan.id;
  await sql`
    insert into user_subscriptions (user_id, plan_id, status, start_date)
    values (${supplier.userId}, ${testPlanId}, 'active', now())
  `;

  const supplierCookie = await login(supplierEmail);
  const shopCookie = await login(shopEmail);
  check('supplier login', true);
  check('shop login', true);

  // --- supplier: catalogue ----------------------------------------------
  let r = await api('/api/supplier/catalogue/usage', { cookie: supplierCookie });
  check('sku usage before adds', r.status === 200 && r.json.skuLimit === 2 && r.json.activeSkus === 0,
    JSON.stringify(r.json));

  r = await api('/api/supplier/catalogue', { method: 'POST', cookie: supplierCookie, body: MEDICINE });
  check('add catalogue item', r.status === 201, JSON.stringify(r.json).slice(0, 160));

  r = await api('/api/supplier/catalogue', { method: 'POST', cookie: supplierCookie, body: MEDICINE });
  check('duplicate batch rejected', r.status === 409, `status ${r.status}`);

  r = await api('/api/supplier/catalogue', {
    method: 'POST', cookie: supplierCookie,
    body: { ...MEDICINE, medicineName: 'Bad', composition: '', mrp: 'abc' }
  });
  check('invalid item rejected', r.status === 400, `status ${r.status}`);

  // Bulk import: 1 new valid SKU (fills limit to 2), 1 over-limit, 1 invalid.
  const importRows = [
    { ...MEDICINE, medicineName: `E2E Importol ${stamp}`, composition: `E2EImportol-${stamp}`, batchNumber: `E2E-${stamp}-B` },
    { ...MEDICINE, medicineName: `E2E Overflow ${stamp}`, composition: `E2EOverflow-${stamp}`, batchNumber: `E2E-${stamp}-C` },
    { ...MEDICINE, medicineName: 'Missing Fields', composition: '', batchNumber: `E2E-${stamp}-D` }
  ];
  r = await api('/api/supplier/catalogue/import', { method: 'POST', cookie: supplierCookie, body: { items: importRows } });
  const imp = r.json || {};
  check('bulk import partial success', r.status === 201 && imp.created === 1 && imp.failed === 2,
    JSON.stringify({ created: imp.created, failed: imp.failed, errors: imp.errors }));

  r = await api('/api/supplier/catalogue/usage', { cookie: supplierCookie });
  check('sku usage at limit', r.status === 200 && r.json.activeSkus === 2 && r.json.skuLimit === 2,
    JSON.stringify(r.json));

  r = await api('/api/supplier/catalogue', { cookie: supplierCookie });
  check('catalogue lists items', r.status === 200 && Array.isArray(r.json) && r.json.length === 2,
    `count=${r.json?.length}`);

  // --- retailer: search + enquiry ----------------------------------------
  r = await api(`/api/search?query=E2ETestmol-${stamp}`);
  const offers = Array.isArray(r.json) ? r.json : [];
  check('live search finds listing', offers.length >= 1 && offers[0].medicineName?.includes('E2E Testmol'),
    `offers=${offers.length} netPrice=${offers[0]?.netPrice}`);

  const offer = offers.find((o) => o.medicineName?.includes('E2E Testmol')) || offers[0];
  r = await api('/api/enquiries', {
    method: 'POST', cookie: shopCookie,
    body: { listingId: offer.id, quantity: 25, message: 'E2E enquiry — please confirm stock.' }
  });
  check('retailer submits enquiry', r.status === 201 && r.json?.status, JSON.stringify(r.json).slice(0, 140));

  r = await api('/api/enquiries/mine', { cookie: shopCookie });
  check('shop sees own enquiry', r.status === 200 && r.json?.some((e) => e.supplierName === 'E2E Distributors' && e.quantity === 25),
    JSON.stringify(r.json).slice(0, 200));

  r = await api('/api/supplier/enquiries', { cookie: supplierCookie });
  check('supplier sees enquiry', r.status === 200 && r.json?.some((e) => e.quantity === 25 && e.message?.includes('E2E enquiry')),
    JSON.stringify(r.json).slice(0, 240));

  // Preview-role write protection still holds (only when LOCAL_ROLE_PREVIEW=true).
  const preview = await api('/api/auth/preview', { method: 'POST', body: { role: 'supplier' } });
  if (preview.status === 200) {
    r = await api('/api/supplier/catalogue', { method: 'POST', cookie: preview.jar, body: MEDICINE });
    check('preview role cannot write', r.status === 403, `status ${r.status}`);
  }
} catch (error) {
  check('script completed', false, error.message);
} finally {
  // --- cleanup ------------------------------------------------------------
  try {
    if (supplier) {
      await sql`delete from enquiries where supplier_id = ${supplier.userId} or medical_shop_id = ${supplier.userId}`;
      await sql`delete from supplier_listings where supplier_id = ${supplier.userId}`;
      await sql`delete from suppliers where user_id = ${supplier.userId}`;
      await sql`delete from user_subscriptions where user_id = ${supplier.userId}`;
      await sql`delete from users where id = ${supplier.userId}`;
      await sql`delete from auth.users where id = ${supplier.authId}`;
    }
    if (shop) {
      await sql`delete from enquiries where medical_shop_id = ${shop.userId}`;
      await sql`delete from users where id = ${shop.userId}`;
      await sql`delete from auth.users where id = ${shop.authId}`;
    }
    if (testPlanId) {
      const [{ c }] = await sql`select count(*)::int c from user_subscriptions where plan_id = ${testPlanId}`;
      if (c === 0) await sql`delete from subscription_plans where id = ${testPlanId}`;
    }
    await sql`delete from master_medicines where generic_name like 'E2ETestmol-%' or generic_name like 'E2EImportol-%' or generic_name like 'E2EOverflow-%'`;
  } catch (cleanupError) {
    console.error('cleanup warning:', cleanupError.message);
  }
  await sql.end();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
