'use client';

import Link from 'next/link';
import { Building2, Search } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { ComparisonPreview } from '@/components/landing/comparison-preview';
import { PlatformExplainer } from '@/components/landing/platform-explainer';
import { SiteFooter } from '@/components/site-footer';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/features/i18n/language-provider';

export default function HomePage() {
  const { language } = useLanguage();
  const tamil = language === 'ta';

  return (
    <div lang={language} className="flex min-h-screen flex-col bg-brand-background text-slate-900">
      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6 sm:py-4 lg:flex-nowrap">
          <Link href="/" aria-label="The Connect Pharma home" className="shrink-0">
            <BrandLogo size="medium" />
          </Link>
          <nav aria-label={tamil ? 'முதன்மை வழிசெலுத்தல்' : 'Main navigation'} className="order-3 flex w-full items-center gap-3 overflow-x-auto overscroll-x-contain text-xs font-semibold text-slate-600 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 lg:order-none lg:mx-auto lg:w-auto lg:flex-1 lg:justify-center lg:gap-3 xl:gap-5 xl:text-sm">
            <Link href="/" aria-current="page" className="shrink-0 border-b-2 border-[#0B3B60] px-1 py-3 text-[#0B3B60]">
              {tamil ? 'தள அறிமுகம்' : 'Platform Overview'}
            </Link>
            <Link href="/search" className="shrink-0 py-3 transition hover:text-[#0B3B60]">
              {tamil ? 'மருந்தக தேடல்' : 'Medical Shop Portal'}
            </Link>
            <Link href="/supplier/catalogue" className="shrink-0 py-3 transition hover:text-[#0B3B60]">
              {tamil ? 'விநியோகஸ்தர் பட்டியல்' : 'Supplier Dashboard'}
            </Link>
            <Link href="/admin/approvals" className="shrink-0 py-3 transition hover:text-[#0B3B60]">
              {tamil ? 'நிர்வாகம்' : 'Admin'}
            </Link>
          </nav>
          <LanguageToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="landing-hero-grid mx-auto mt-4 grid w-[calc(100%-2rem)] max-w-7xl items-center gap-6 rounded-3xl bg-[linear-gradient(112deg,#07345e_0%,#06477b_62%,#08705f_130%)] px-4 py-6 text-white shadow-soft sm:mt-8 sm:w-[calc(100%-3rem)] sm:gap-10 sm:px-8 sm:py-10 lg:gap-12 lg:px-12 lg:py-12">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200 sm:text-sm">
              {tamil ? 'சரிபார்க்கப்பட்ட மருந்து சந்தை' : 'Verified wholesale marketplace'}
            </p>
            <h1 className="max-w-[680px] text-[clamp(1.9rem,7vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:tracking-[-0.05em]">
              {tamil ? 'சரிபார்க்கப்பட்ட விநியோகஸ்தர்களின் மொத்த மருந்து விலைகளை ஒப்பிடுங்கள்.' : 'Compare Wholesale Medicine Prices Across Verified Suppliers.'}
            </h1>
            <p className="mt-4 max-w-[650px] text-sm leading-6 text-blue-50 sm:mt-5 sm:text-lg sm:leading-7">
              {tamil
                ? 'ConnectPharma.in மருந்து நிறுவனங்கள், மொத்த விற்பனையாளர்கள் மற்றும் சில்லறை மருந்தகங்களை இணைக்கிறது. மருந்து கலவை, அளவு, பேக் மற்றும் விலைகளை விரைவாக ஒப்பிடுங்கள்.'
                : 'ConnectPharma.in bridges Pharmaceutical Companies, Wholesalers, and Retail Medical Shops. Compare exact compositions, strengths, pack sizes, active schemes, and net rates in seconds.'}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/search"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-emerald px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#07345e] sm:min-h-[52px] sm:px-5"
              >
                <Search aria-hidden="true" className="h-4 w-4" />
                {tamil ? 'மருந்தக தேடலைத் தொடங்குங்கள்' : 'Launch Medical Shop Search (Free)'}
              </Link>
              <Link
                href="/supplier/catalogue"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-brand-navy shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#07345e] sm:min-h-[52px] sm:px-5"
              >
                <Building2 aria-hidden="true" className="h-4 w-4" />
                {tamil ? 'விநியோகஸ்தர் பட்டியல் மற்றும் திட்டங்கள்' : 'Supplier Catalogue & Plans'}
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-blue-100 sm:text-sm">
              <span>{tamil ? 'ஒப்பிடு' : 'Compare'}</span><span aria-hidden="true">•</span>
              <span>{tamil ? 'இணை' : 'Connect'}</span><span aria-hidden="true">•</span>
              <span>{tamil ? 'வளர்' : 'Grow'}</span>
            </div>
          </div>
          <div className="min-w-0">
            <ComparisonPreview language={language} />
          </div>
        </section>
        <PlatformExplainer language={language} />
      </main>
      <SiteFooter language={language} />
    </div>
  );
}
