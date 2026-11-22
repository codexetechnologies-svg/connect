import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { ProtectedNavigation } from '@/components/protected-navigation';
import { SiteFooter } from '@/components/site-footer';
import { LanguageToggle } from '@/components/language-toggle';
import { requireAppAccount } from '@/server/app-account';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAppAccount();

  return (
    <div className="flex min-h-screen flex-col bg-brand-background">
      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full items-center justify-between lg:w-auto">
            <Link href="/" aria-label="The Connect Pharma home" className="self-start">
              <BrandLogo size="small" />
            </Link>
            <div className="lg:hidden">
              <LanguageToggle />
            </div>
          </div>
          <ProtectedNavigation role={account.role} />
          <div className="hidden lg:block">
            <LanguageToggle />
          </div>
        </div>
      </header>
      {children}
      <SiteFooter />
    </div>
  );
}
