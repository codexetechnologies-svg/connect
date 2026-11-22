'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/features/i18n/language-provider';

const metrics = [
  { label: 'Active medicine SKUs', value: '1,284', tone: 'bg-[#0B3B60]' },
  { label: 'Average discount', value: '12.4%', tone: 'bg-[#16A34A]' },
  { label: 'Pending enquiries', value: '29', tone: 'bg-[#D97706]' }
];

export default function DashboardPage() {
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const { t } = useLanguage();

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-eyebrow">{t('Dashboard')}</p>
            <h1 className="page-title">{t('Account overview')}</h1>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setLastRefreshed(new Date().toLocaleTimeString())}
          >
            {t('Refresh sample catalog')}
          </Button>
        </header>

        {lastRefreshed && (
          <p role="status" className="mb-5 text-sm text-slate-600">
            {t('Sample catalog refreshed at')} {lastRefreshed}. {t('Demo data is not connected to a live feed.')}
          </p>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((item) => (
            <div key={item.label} className="card p-5">
              <div className={`mb-4 h-2.5 w-16 rounded-full ${item.tone}`} />
              <div className="text-3xl font-black text-[#0B3B60]">{item.value}</div>
              <div className="mt-2 text-sm text-slate-600">{t(item.label)}</div>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{t('Recent approvals')}</h2>
              <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">{t('Verified')}</span>
            </div>

            <div className="mt-6 space-y-4">
              {[
                ['Paracetamol 650mg', 'Astra Pharma', '₹18.40'],
                ['Amoxicillin 500mg', 'Bharat Labs', '₹64.20'],
                ['Vitamin B12 Injection', 'Cureline', '₹271.00']
              ].map(([medicine, supplier, price]) => (
                <div key={medicine} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{medicine}</p>
                    <p className="text-sm text-slate-500">{supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0B3B60]">{price}</p>
                    <p className="text-xs uppercase tracking-[0.15em] text-emerald-700">{t('In Stock')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-slate-900">{t('Account status')}</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">{t('KYC verification')}</p>
                <p className="mt-1 text-xl font-bold text-emerald-900">{t('Approved')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{t('Subscription')}</p>
                <p className="mt-1 text-xl font-bold text-[#0B3B60]">{t('Professional')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{t('District coverage')}</p>
                <p className="mt-1 text-xl font-bold text-[#0B3B60]">Madurai • Tirunelveli</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
