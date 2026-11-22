'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/features/i18n/language-provider';

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="The Connect Pharma home">
          <BrandLogo size="medium" />
        </Link>
        <LanguageToggle />
      </div>
      <article className="mt-10">
        <h1 className="text-3xl font-extrabold text-brand-navy">{t('Terms & Conditions')}</h1>
        <p className="mt-5 leading-7 text-slate-600">
          {t('By using Connect Pharma, you agree to provide accurate information and use the platform lawfully. Suppliers are responsible for the accuracy of their listings, pricing, availability, licenses, and fulfilment terms.')}
        </p>
        <p className="mt-4 leading-7 text-slate-600">
          {t('For terms and platform questions, contact')}{' '}
          <a className="font-semibold text-brand-navy underline" href="mailto:connectpharma@gmail.com">
            connectpharma@gmail.com
          </a>.
        </p>
      </article>
    </main>
  );
}
