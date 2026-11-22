'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/features/i18n/language-provider';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-extrabold text-brand-navy">{t('Privacy Policy')}</h1>
        <p className="mt-5 leading-7 text-slate-600">
          {t('Connect Pharma respects your privacy. Information submitted through the platform is used only to provide marketplace, account, and support services. We do not sell personal information to third parties.')}
        </p>
        <p className="mt-4 leading-7 text-slate-600">
          {t('For privacy questions or data requests, contact')}{' '}
          <a className="font-semibold text-brand-navy underline" href="mailto:connectpharma@gmail.com">
            connectpharma@gmail.com
          </a>.
        </p>
      </article>
    </main>
  );
}
