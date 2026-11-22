'use client';

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/features/i18n/language-provider';

const initialRequests = [
  { name: 'Asha Pharma', type: 'Wholesale Drug Licence', status: 'pending', rating: 'High risk' },
  { name: 'Rathnam Medicals', type: 'Retail Drug Licence', status: 'approved', rating: 'Verified' },
  { name: 'Sundaram Distributors', type: 'GST', status: 'review', rating: 'Needs docs' }
];

export default function AdminApprovalsPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState(initialRequests);
  const [reviewingName, setReviewingName] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const pendingCount = requests.filter((request) => request.status !== 'approved').length;

  function updateRequest(name: string, status: 'approved' | 'review') {
    setRequests((current) =>
      current.map((request) => (request.name === name ? { ...request, status } : request))
    );
    setNotice(
      status === 'approved'
        ? t('Account approved for {name} in this demo session.').replace('{name}', name)
        : t('Documents requested from {name} for this demo session.').replace('{name}', name)
    );
  }

  function approveBatch() {
    const count = requests.filter((request) => request.status !== 'approved').length;
    if (count === 0) {
      setNotice(t('There are no pending sample accounts to approve.'));
      return;
    }

    setRequests((current) => current.map((request) => ({ ...request, status: 'approved' })));
    setReviewingName(null);
    setNotice(t('{count} sample accounts approved for this demo session.').replace('{count}', String(count)));
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-eyebrow">{t('Admin controls')}</p>
            <h1 className="page-title">{t('KYC approval queue')}</h1>
          </div>
          <Button type="button" variant="success" onClick={approveBatch}>{t('Approve batch')}</Button>
        </header>

        {notice && <p role="status" className="mb-5 text-sm text-slate-600">{notice}</p>}

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: t('Pending in this sample'), value: String(pendingCount), tone: 'bg-brand-amber' },
            { label: t('Approved in this sample'), value: String(requests.length - pendingCount), tone: 'bg-brand-emerald' },
            { label: t('Reports generated'), value: '24', tone: 'bg-[#0B3B60]' }
          ].map((item) => (
            <div key={item.label} className="card p-5">
              <div className={`mb-3 h-2.5 w-16 rounded-full ${item.tone}`} />
              <div className="text-3xl font-black text-brand-navy">{item.value}</div>
              <p className="mt-2 text-sm text-slate-600">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-900">{t('Account review list')}</h2>
          </div>

          <div className="divide-y divide-brand-border">
            {requests.map((request) => {
              const isReviewing = reviewingName === request.name;

              return (
                <div key={request.name} className="px-6 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{request.name}</p>
                      <p className="text-sm text-slate-500">{t(request.type)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="badge border-slate-200 bg-slate-100 text-slate-700">{t(request.rating)}</span>
                      <span className={`badge ${request.status === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : request.status === 'review' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                        {t(request.status === 'approved' ? 'Approved' : request.status === 'review' ? 'Needs documents' : request.status)}
                      </span>
                      <Button
                        type="button"
                        variant={request.status === 'approved' ? 'secondary' : 'primary'}
                        size="sm"
                        aria-expanded={isReviewing}
                        onClick={() => setReviewingName(isReviewing ? null : request.name)}
                      >
                        {t(request.status === 'approved' ? 'View' : 'Review')}
                      </Button>
                    </div>
                  </div>
                  {isReviewing && (
                    <div className="mt-4 rounded-xl border border-brand-border bg-slate-50 p-4">
                      <p className="text-sm text-slate-700">
                        {t('Review the submitted {type} for {name}.').replace('{type}', request.type.toLowerCase()).replace('{name}', request.name)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{t('Demo action only; no KYC documents are stored or checked.')}</p>
                      {request.status !== 'approved' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="success" onClick={() => updateRequest(request.name, 'approved')}>
                            {t('Approve account')}
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => updateRequest(request.name, 'review')}>
                            {t('Request documents')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
