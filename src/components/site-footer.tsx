'use client';

import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { useLanguage } from '@/features/i18n/language-provider';

type SiteFooterProps = {
  language?: 'en' | 'ta';
};

export function SiteFooter({ language }: SiteFooterProps) {
  const { language: selectedLanguage, t } = useLanguage();
  const tamil = (language ?? selectedLanguage) === 'ta';

  return (
    <footer className="border-t border-brand-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr] md:items-start">
          <div>
          <Link href="/" aria-label={tamil ? 'Connect Pharma முகப்பு' : 'The Connect Pharma home'}>
            <BrandLogo size="small" />
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            {tamil
              ? 'மருந்தகங்களையும் விநியோகஸ்தர்களையும் இணைக்கிறது.'
              : t('Wholesale medicine comparison, made simple.')}
          </p>
          </div>

          <address className="not-italic">
            <h2 className="text-sm font-bold text-brand-navy">
              {tamil ? 'தொடர்பு'               : t('Contact')}
            </h2>
            <a
              className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-600 transition hover:text-brand-navy"
              href="mailto:connectpharma@gmail.com"
            >
              <Mail aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
              <span className="break-all sm:break-normal">connectpharma@gmail.com</span>
            </a>
            <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600">
              <MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
              <span>
                {tamil ? 'மதுரை, தமிழ்நாடு, இந்தியா' : 'Madurai, Tamil Nadu, India'}
              </span>
            </p>
          </address>

          <nav
            aria-label={tamil ? 'அடிக்குறிப்பு வழிசெலுத்தல்' : 'Footer navigation'}
            className="flex flex-col gap-2 text-sm font-medium text-slate-600"
          >
            <h2 className="mb-1 text-sm font-bold text-brand-navy">
              {tamil ? 'விரைவு இணைப்புகள்' : 'Quick links'}
            </h2>
            <Link className="transition hover:text-brand-navy" href="/search">
              {tamil ? 'மருந்தக தேடல்' : t('Medical shop search')}
            </Link>
            <Link className="transition hover:text-brand-navy" href="/supplier/catalogue">
              {tamil ? 'விநியோகஸ்தர் பட்டியல்' : t('Supplier catalogue')}
            </Link>
            <Link className="transition hover:text-brand-navy" href="/login">
              {tamil ? 'உள்நுழைவு' : t('Sign in')}
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-brand-border pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Connect Pharma.{' '}
            {tamil ? 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' : t('All rights reserved.')}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link className="transition hover:text-brand-navy" href="/privacy-policy">
              {tamil ? 'தனியுரிமைக் கொள்கை' : t('Privacy Policy')}
            </Link>
            <Link className="transition hover:text-brand-navy" href="/terms">
              {tamil ? 'விதிமுறைகள் மற்றும் நிபந்தனைகள்' : t('Terms & Conditions')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
