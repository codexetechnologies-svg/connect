'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/features/i18n/language-provider';

export function PlanCard({
  tier,
  skuLimit,
  fee,
  selected,
  onSelect
}: {
  tier: string;
  skuLimit: number;
  fee: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="card p-5">
      <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">{t(tier)}</div>
      <div className="mt-3 text-3xl font-black text-[#0B3B60]">₹{fee}</div>
      <p className="mt-2 text-sm text-slate-600">{t('Up to')} {skuLimit} {t('active SKUs')}</p>
      <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
        <span>{t('Monthly')}</span>
        <span>{t('Launch offer')}</span>
      </div>
      <Button
        type="button"
        variant={selected ? 'success' : 'primary'}
        aria-pressed={selected}
        onClick={onSelect}
        className="mt-5 w-full"
      >
        {t(selected ? 'Selected' : 'Select plan')}
      </Button>
    </div>
  );
}
