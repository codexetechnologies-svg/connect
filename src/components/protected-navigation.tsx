'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@clerk/nextjs';
import { useLanguage } from '@/features/i18n/language-provider';
import type { AppRole } from '@/server/app-account';

const navigation = [
  { href: '/dashboard', label: 'Overview', roles: ['supplier', 'medical-shop', 'admin'] },
  { href: '/search', label: 'Search', roles: ['medical-shop', 'admin'] },
  { href: '/map', label: 'Map', roles: ['medical-shop', 'admin'] },
  { href: '/supplier/catalogue', label: 'Catalogue', roles: ['supplier', 'admin'] },
  { href: '/supplier/enquiries', label: 'Enquiries', roles: ['supplier', 'admin'] },
  { href: '/admin/approvals', label: 'Approvals', roles: ['admin'] },
  { href: '/admin/revenue', label: 'Revenue', roles: ['admin'] },
  { href: '/admin/subscriptions', label: 'Plans', roles: ['admin'] }
];

export function ProtectedNavigation({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const { language, t } = useLanguage();

  return (
    <nav aria-label={language === 'ta' ? 'முதன்மை வழிசெலுத்தல்' : 'Main navigation'} className="flex w-full min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:text-sm lg:w-auto">
      {navigation.filter((item) => item.roles.includes(role)).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`min-h-10 shrink-0 rounded-lg px-2.5 py-2 font-medium transition-colors sm:px-3 ${
              active
                ? 'bg-blue-50 text-brand-navy'
                : 'text-slate-600 hover:bg-slate-50 hover:text-brand-navy'
            }`}
          >
            {t(item.label)}
          </Link>
        );
      })}
      <SignOutButton redirectUrl="/login">
        <button
          type="button"
          className="shrink-0 rounded-lg px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-navy"
        >
          {t('Sign out')}
        </button>
      </SignOutButton>
    </nav>
  );
}
