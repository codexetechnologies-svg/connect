'use client';

import { useEffect, useState } from 'react';
import { PlanCard } from '@/components/subscription/plan-card';
import { subscriptionPlans } from '@/lib/data/mock-data';
import { useLanguage } from '@/features/i18n/language-provider';

export default function AdminSubscriptionsPage() {
  const { t } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const savedTier = window.localStorage.getItem('connect-pharma-demo-plan');
      if (subscriptionPlans.some((plan) => plan.tier === savedTier)) {
        setSelectedTier(savedTier);
        setNotice(`${savedTier} ${t('is your saved demo selection. Billing is not connected.')}`);
      }
    } catch {
      setNotice(t('Browser storage is unavailable; plan selection will only last until you leave this page.'));
    }
  }, [t]);

  function selectPlan(tier: string) {
    setSelectedTier(tier);
    try {
      window.localStorage.setItem('connect-pharma-demo-plan', tier);
      setNotice(`${tier} ${t('is selected in this browser. Billing is not connected in this demo.')}`);
    } catch {
      setNotice(`${tier} ${t('is selected for this page only. Browser storage is unavailable; billing is not connected.')}`);
    }
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        <div className="mb-6">
          <p className="page-eyebrow">{t('Plan management')}</p>
          <h1 className="page-title">{t('Subscription engine')}</h1>
        </div>

        <p role="status" className="mb-5 text-sm text-slate-600">
          {notice || t('Choose a plan to save your demo selection in this browser. No payment will be collected.')}
        </p>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {subscriptionPlans.map((plan) => (
            <PlanCard
              key={plan.tier}
              tier={plan.tier}
              skuLimit={plan.skuLimit}
              fee={plan.fee}
              selected={selectedTier === plan.tier}
              onSelect={() => selectPlan(plan.tier)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
