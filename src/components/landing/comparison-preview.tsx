import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

const offers = [
  {
    supplier: 'Company C (Nellai Wholesale)',
    detail: 'Best Net Price · 10+1 Scheme',
    detailTa: 'சிறந்த நிகர விலை · 10+1 சலுகை',
    price: '₹17.00',
    best: true
  },
  {
    supplier: 'Company A (Sri Meenakshi Pharma)',
    detail: 'In Stock · Anna Nagar, Madurai',
    detailTa: 'இருப்பில் உள்ளது · அண்ணா நகர், மதுரை',
    price: '₹18.00',
    best: false
  },
  {
    supplier: 'Company D (Pandian Health Corp)',
    detail: 'In Stock · KK Nagar, Madurai',
    detailTa: 'இருப்பில் உள்ளது · கே.கே. நகர், மதுரை',
    price: '₹19.00',
    best: false
  }
];

export function ComparisonPreview({ language = 'en' }: { language?: 'en' | 'ta' }) {
  const tamil = language === 'ta';

  return (
    <aside className="rounded-[22px] border border-white/70 bg-[#f7f9fc] p-5 text-slate-900 shadow-[0_20px_55px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.09em] text-brand-navy">{tamil ? 'நேரடி ஒப்பீடு மாதிரி' : 'Live comparison sample'}</p>
          <h2 className="mt-1 text-lg font-bold leading-tight text-slate-950">Paracetamol 650 mg Tablet</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {tamil ? 'சரியான பொருத்தம்: ஒரு பட்டையில் 15 மாத்திரைகள் · மதுரை சரிபார்க்கப்பட்ட விநியோகஸ்தர்கள்' : 'Exact Match: 15 Tablets / Strip · Verified Madurai Suppliers'}
          </p>
        </div>
        <span className="inline-flex min-w-[86px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-emerald-100 px-3.5 py-2 text-sm font-bold text-emerald-800">
          {tamil ? '4 விலைப்புள்ளிகள்' : '4 Quotes'}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {offers.map((offer) => (
          <article
            key={offer.supplier}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3.5 ${
              offer.best
                ? 'border-emerald-100 bg-[#eefbf3]'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{offer.supplier}</p>
              <p className={`mt-1 truncate text-xs ${offer.best ? 'font-medium text-emerald-700' : 'text-slate-500'}`}>
                {offer.best && <Check aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />}
                {tamil ? offer.detailTa : offer.detail}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-lg font-extrabold tracking-tight ${offer.best ? 'text-emerald-700' : 'text-slate-900'}`}>
                {offer.price}
              </p>
              <p className="text-[11px] text-slate-500">{tamil ? 'ஒரு ஸ்ட்ரிப்பிற்கு' : 'per strip'}</p>
            </div>
          </article>
        ))}
      </div>

      <Link
        href="/search"
        className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#064477] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#0B3B60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
      >
        {tamil ? 'அனைத்து மருந்துகளையும் ஒப்பிட்டு விசாரிக்கவும்' : 'Compare All Medicines & Send Enquiry'}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </aside>
  );
}
