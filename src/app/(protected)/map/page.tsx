'use client';

import dynamic from 'next/dynamic';
import { searchResults } from '@/lib/data/mock-data';
import { useLanguage } from '@/features/i18n/language-provider';

const GoogleSupplierMap = dynamic(
  () => import('@/components/maps/google-supplier-map').then((module) => module.GoogleSupplierMap),
  {
    ssr: false,
    loading: () => (
      <div className="card flex h-[520px] items-center justify-center text-sm font-medium text-slate-500">
        Loading map…
      </div>
    )
  }
);

export default function MapPage() {
  const { t } = useLanguage();
  return (
    <main className="page-shell">
      <div className="page-container">
        <div className="mb-6">
          <p className="page-eyebrow">{t('Map view')}</p>
          <h1 className="page-title">{t('Google Maps · Dealer coverage and distance')}</h1>
          <p className="page-description">
            {t('Pins use example city-level supplier coordinates and circles show each supplier’s delivery radius.')}
          </p>
        </div>

        <GoogleSupplierMap suppliers={searchResults} />
      </div>
    </main>
  );
}
