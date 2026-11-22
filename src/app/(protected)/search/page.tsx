'use client';

import { SearchExperience } from '@/components/marketplace/search-experience';
import { useLanguage } from '@/features/i18n/language-provider';

export default function SearchPage() {
  const { t } = useLanguage();
  return (
    <main className="page-shell">
      <div className="page-container space-y-8">
        <div>
          <p className="page-eyebrow">{t('Medical shop portal')}</p>
          <h1 className="page-title">{t('Find the best wholesale price')}</h1>
        </div>

        <SearchExperience />
      </div>
    </main>
  );
}
