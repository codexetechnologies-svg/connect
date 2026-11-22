'use client';

import { revenueTrend } from '@/lib/data/mock-data';
import { useLanguage } from '@/features/i18n/language-provider';

export function RevenueReport() {
  const { t } = useLanguage();
  const max = Math.max(...revenueTrend.map((item) => item.value));

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t('Revenue trend')}</h2>
        <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">{t('GST ready')}</span>
      </div>

      <div className="flex h-48 items-end gap-4">
        {revenueTrend.map((entry) => (
          <div key={entry.month} className="flex flex-1 flex-col items-center gap-3">
            <div className="w-full rounded-t-xl bg-[#0B3B60]" style={{ height: `${(entry.value / max) * 100}%` }} />
            <div className="text-xs font-medium text-slate-500">{entry.month}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
