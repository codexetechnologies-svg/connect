import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Search,
  Send,
  Store,
  Tags
} from 'lucide-react';

const content = {
  en: {
    intro: 'A clearer way to source wholesale medicines',
    title: 'From product search to supplier conversation',
    description:
      'ConnectPharma brings medical shops and medicine suppliers into one place to make product discovery, price comparison, and business enquiries easier.',
    stepsTitle: 'How the platform works',
    stepsDescription: 'A simple path from a supplier listing to a useful quote.',
    steps: [
      {
        title: 'Suppliers create a catalogue',
        description:
          'Suppliers share medicine names, compositions, strengths, pack sizes, indicative prices, stock, and available schemes.'
      },
      {
        title: 'Medical shops search',
        description:
          'Search by medicine or supplier, then narrow results by brand, pack size, and distance to find relevant listings.'
      },
      {
        title: 'Compare matching offers',
        description:
          'Review listed prices, stock, supplier details, and schemes side by side. Like-for-like pack details help make comparisons clearer.'
      },
      {
        title: 'Send an enquiry and discuss',
        description:
          'Contact a supplier with a requirement and discuss the quote, availability, and terms directly before placing an order.'
      }
    ],
    beneficiariesTitle: 'Built for every side of the supply chain',
    beneficiariesDescription:
      'The platform helps businesses find each other and start better-informed conversations.',
    beneficiaries: [
      {
        icon: Store,
        title: 'Retail medical shops',
        description:
          'Discover wholesale options, compare listed prices and availability, and enquire with suppliers for the products you need.',
        link: '/search',
        linkText: 'Explore medicine search'
      },
      {
        icon: Building2,
        title: 'Wholesalers and distributors',
        description:
          'Present a structured catalogue to potential buyers, share stock and scheme details, and respond to shop enquiries.',
        link: '/supplier/catalogue',
        linkText: 'Explore supplier catalogue'
      },
      {
        icon: Tags,
        title: 'Pharmaceutical companies',
        description:
          'Make product and offer information easier for the downstream supply network to discover and compare.',
        link: '/supplier/catalogue',
        linkText: 'See supplier options'
      }
    ],
    trustTitle: 'Clear information. Business stays in control.',
    trustDescription:
      'Supplier profiles can include business and licence details for review. Buyers and suppliers discuss and confirm final prices, order terms, payment, and delivery with each other.',
    prototypeTitle: 'About this preview',
    prototypeDescription:
      'This site is a product prototype. Listings, verification decisions, and enquiries shown here use sample data; it is not connected to live supplier feeds, ordering, payments, or delivery services.'
  },
  ta: {
    intro: 'மொத்த மருந்து வாங்குவதற்கான எளிய வழி',
    title: 'மருந்து தேடலிலிருந்து விநியோகஸ்தர் உரையாடல் வரை',
    description:
      'மருந்தகங்களையும் மருந்து விநியோகஸ்தர்களையும் ஒரே தளத்தில் இணைத்து, பொருட்களைக் கண்டறிதல், விலைகளை ஒப்பிடுதல், வணிக விசாரணைகளை எளிதாக்குகிறது ConnectPharma.',
    stepsTitle: 'தளம் எவ்வாறு செயல்படுகிறது',
    stepsDescription: 'விநியோகஸ்தர் பட்டியலிலிருந்து பயனுள்ள விலைப்புள்ளி வரை எளிய செயல்முறை.',
    steps: [
      {
        title: 'விநியோகஸ்தர்கள் பட்டியல் உருவாக்குகிறார்கள்',
        description:
          'மருந்துப் பெயர், கலவை, அளவு, பேக், குறிப்பு விலை, இருப்பு மற்றும் சலுகை விவரங்களைப் பகிர்கிறார்கள்.'
      },
      {
        title: 'மருந்தகங்கள் தேடுகின்றன',
        description:
          'மருந்து அல்லது விநியோகஸ்தர் மூலம் தேடி, பிராண்ட், பேக் அளவு, தூரம் ஆகியவற்றால் முடிவுகளை வடிகட்டலாம்.'
      },
      {
        title: 'பொருந்தும் சலுகைகளை ஒப்பிடுங்கள்',
        description:
          'பட்டியலிடப்பட்ட விலை, இருப்பு, விநியோகஸ்தர் விவரம், சலுகைகளை ஒப்பிடுங்கள். ஒரே பேக் விவரங்கள் சரியான ஒப்பீட்டிற்கு உதவும்.'
      },
      {
        title: 'விசாரித்து நேரடியாகப் பேசுங்கள்',
        description:
          'தேவையான பொருட்களுடன் விநியோகஸ்தருக்கு விசாரணை அனுப்பி, ஆர்டர் செய்வதற்கு முன் விலைப்புள்ளி, இருப்பு, நிபந்தனைகளைப் பேசுங்கள்.'
      }
    ],
    beneficiariesTitle: 'விநியோகச் சங்கிலியின் அனைவருக்கும்',
    beneficiariesDescription:
      'வணிகங்கள் ஒன்றையொன்று கண்டறிந்து தெளிவான தகவலுடன் உரையாடலைத் தொடங்க இந்தத் தளம் உதவுகிறது.',
    beneficiaries: [
      {
        icon: Store,
        title: 'சில்லறை மருந்தகங்கள்',
        description:
          'மொத்த விற்பனை வாய்ப்புகளைக் கண்டறிந்து, பட்டியலிடப்பட்ட விலை மற்றும் இருப்பை ஒப்பிட்டு, தேவையான பொருட்களுக்கு விநியோகஸ்தர்களிடம் விசாரிக்கலாம்.',
        link: '/search',
        linkText: 'மருந்து தேடலைப் பார்க்கவும்'
      },
      {
        icon: Building2,
        title: 'மொத்த விற்பனையாளர்கள் மற்றும் விநியோகஸ்தர்கள்',
        description:
          'கட்டமைக்கப்பட்ட பட்டியலை வாங்குபவர்களிடம் பகிர்ந்து, இருப்பு மற்றும் சலுகை விவரங்களைத் தெரிவித்து, மருந்தக விசாரணைகளுக்கு பதிலளிக்கலாம்.',
        link: '/supplier/catalogue',
        linkText: 'விநியோகஸ்தர் பட்டியலைப் பார்க்கவும்'
      },
      {
        icon: Tags,
        title: 'மருந்து நிறுவனங்கள்',
        description:
          'மருந்துகள் மற்றும் சலுகை விவரங்களை விநியோகச் சங்கிலியினர் எளிதாகக் கண்டறிந்து ஒப்பிட உதவலாம்.',
        link: '/supplier/catalogue',
        linkText: 'விநியோகஸ்தர் விருப்பங்களைப் பார்க்கவும்'
      }
    ],
    trustTitle: 'தெளிவான தகவல். வணிக முடிவுகள் உங்கள் கையில்.',
    trustDescription:
      'விநியோகஸ்தர் சுயவிவரங்களில் வணிகம் மற்றும் உரிம விவரங்களைச் சரிபார்ப்புக்காகச் சேர்க்கலாம். இறுதி விலை, ஆர்டர் நிபந்தனைகள், கட்டணம், விநியோகம் ஆகியவற்றை வாங்குபவரும் விநியோகஸ்தரும் நேரடியாக உறுதிப்படுத்துவார்கள்.',
    prototypeTitle: 'இந்த முன்னோட்டத்தைப் பற்றி',
    prototypeDescription:
      'இது தயாரிப்பு முன்னோட்டம். இங்கு காட்டப்படும் பட்டியல்கள், சரிபார்ப்பு முடிவுகள், விசாரணைகள் மாதிரி தரவைப் பயன்படுத்துகின்றன; நேரடி விநியோகஸ்தர் தகவல், ஆர்டர், கட்டணம் அல்லது விநியோகச் சேவைகளுடன் இது இணைக்கப்படவில்லை.'
  }
} as const;

const stepIcons = [ClipboardCheck, Search, Tags, Send];

export function PlatformExplainer({ language = 'en' }: { language?: 'en' | 'ta' }) {
  const copy = content[language];

  return (
    <div className="mx-auto w-[calc(100%-2.5rem)] max-w-7xl py-16 sm:w-[calc(100%-3rem)] sm:py-20">
      <section aria-labelledby="platform-intro-title" className="mx-auto max-w-3xl text-center">
        <p className="page-eyebrow">{copy.intro}</p>
        <h2 id="platform-intro-title" className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
          {copy.title}
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{copy.description}</p>
      </section>

      <section aria-labelledby="platform-steps-title" className="mt-14 sm:mt-16">
        <div className="mb-7">
          <h3 id="platform-steps-title" className="text-2xl font-bold text-brand-navy">
            {copy.stepsTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{copy.stepsDescription}</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {copy.steps.map((step, index) => {
            const Icon = stepIcons[index];

            return (
              <li key={step.title} className="card flex flex-col p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold tracking-widest text-brand-emerald">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-navy">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                </div>
                <h4 className="mt-5 text-lg font-bold leading-snug text-slate-900">{step.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="platform-beneficiaries-title" className="mt-16 sm:mt-20">
        <div className="mb-7 max-w-2xl">
          <h3 id="platform-beneficiaries-title" className="text-2xl font-bold text-brand-navy sm:text-3xl">
            {copy.beneficiariesTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{copy.beneficiariesDescription}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {copy.beneficiaries.map((beneficiary) => {
            const Icon = beneficiary.icon;

            return (
              <article key={beneficiary.title} className="card flex flex-col p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-brand-emerald">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h4 className="mt-5 text-lg font-bold text-slate-900">{beneficiary.title}</h4>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{beneficiary.description}</p>
                <Link
                  href={beneficiary.link}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-navy transition hover:text-brand-emerald"
                >
                  {beneficiary.linkText}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="platform-trust-title" className="mt-16 grid gap-5 rounded-3xl bg-[#EAF2F8] p-6 sm:mt-20 sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
        <div>
          <h3 id="platform-trust-title" className="text-xl font-bold text-brand-navy sm:text-2xl">
            {copy.trustTitle}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{copy.trustDescription}</p>
        </div>
        <ClipboardCheck aria-hidden="true" className="hidden h-10 w-10 text-brand-navy/70 sm:block" />
      </section>

      <aside className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-sm font-bold text-slate-800">{copy.prototypeTitle}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{copy.prototypeDescription}</p>
      </aside>
    </div>
  );
}
