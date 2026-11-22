'use client';

import { RevenueReport } from '@/components/admin/revenue-report';
import { useLanguage } from '@/features/i18n/language-provider';

export default function AdminRevenuePage() {
  const { t } = useLanguage();
  return (
    <main className="page-shell">
      <div className="page-container">
        <div className="mb-6">
          <p className="page-eyebrow">{t('Platform analytics')}</p>
          <h1 className="page-title">{t('Monthly revenue and GST reporting')}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <RevenueReport />
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-slate-900">{t('Summary')}</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">{t('Monthly revenue')}</div>
                <div className="mt-1 text-2xl font-black text-[#0B3B60]">₹6,50,000</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">{t('Active subscriptions')}</div>
                <div className="mt-1 text-2xl font-black text-[#0B3B60]">768</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">{t('Pending renewals')}</div>
                <div className="mt-1 text-2xl font-black text-[#0B3B60]">42</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
