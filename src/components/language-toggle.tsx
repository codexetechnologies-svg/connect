'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from '@/features/i18n/language-provider';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const tamil = language === 'ta';

  return (
    <button
      type="button"
      aria-label={tamil ? 'Switch language to English' : 'மொழியை தமிழுக்கு மாற்றவும்'}
      aria-pressed={tamil}
      onClick={toggleLanguage}
      className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-[#0B3B60] hover:text-[#0B3B60] sm:px-3.5 sm:text-sm"
    >
      <Languages aria-hidden="true" className="h-4 w-4 text-[#0B3B60]" />
      {tamil ? 'English' : 'தமிழ் / EN'}
    </button>
  );
}
