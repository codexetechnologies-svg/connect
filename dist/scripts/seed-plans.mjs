import { createSql } from './db.mjs';

const plans = [
  {
    tier: 'Basic',
    skuLimit: 100,
    monthlyFee: '999.00',
    features: ['Up to 100 medicine SKUs', 'Basic search visibility', 'Email support']
  },
  {
    tier: 'Standard',
    skuLimit: 500,
    monthlyFee: '1999.00',
    features: ['Up to 500 medicine SKUs', 'Priority search visibility', 'Phone & email support', 'Analytics dashboard']
  },
  {
    tier: 'Professional',
    skuLimit: 1500,
    monthlyFee: '3999.00',
    features: ['Up to 1500 medicine SKUs', 'Top search visibility', '24/7 support', 'Advanced analytics', 'Bulk import tools']
  },
  {
    tier: 'Enterprise',
    skuLimit: 5000,
    monthlyFee: '6999.00',
    features: ['Up to 5000 medicine SKUs', 'Featured placement', 'Dedicated account manager', 'Custom integrations', 'API access']
  }
];

const sql = createSql();
try {
  for (const plan of plans) {
    await sql`
      insert into subscription_plans (tier, sku_limit, monthly_fee, features, is_active, updated_at)
      values (${plan.tier}, ${plan.skuLimit}, ${plan.monthlyFee}, ${sql.json(plan.features)}, true, now())
      on conflict (tier) do update set
        sku_limit = excluded.sku_limit,
        monthly_fee = excluded.monthly_fee,
        features = excluded.features,
        is_active = true,
        updated_at = now()
    `;
  }
  console.log(`Seeded ${plans.length} subscription plans.`);
} finally {
  await sql.end();
}
