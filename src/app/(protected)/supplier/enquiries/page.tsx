'use client';

import { useState } from 'react';
import { enquiryPipeline } from '@/lib/data/mock-data';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/features/i18n/language-provider';

export default function SupplierEnquiriesPage() {
  const { t } = useLanguage();
  const [leads, setLeads] = useState(enquiryPipeline);
  const [activeLead, setActiveLead] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');

  function exportLeads() {
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      ['Shop', 'Medicine', 'Quantity', 'Status'],
      ...leads.map((lead) => [lead.shop, lead.item, lead.qty, lead.status])
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'connect-pharma-leads.csv';
    link.click();
    URL.revokeObjectURL(url);
    setNotice(t('Lead list downloaded as CSV.'));
  }

  function saveResponse(leadKey: string) {
    if (!draft.trim()) return;
    setLeads((current) =>
      current.map((lead) =>
        `${lead.shop}-${lead.item}` === leadKey ? { ...lead, status: 'Quoted' } : lead
      )
    );
    setActiveLead(null);
    setDraft('');
    setNotice(t('Response saved for this demo session; it was not sent to the shop.'));
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-eyebrow">{t('Supplier CRM')}</p>
            <h1 className="page-title">{t('Medical shop enquiries')}</h1>
          </div>
          <Button type="button" variant="primary" onClick={exportLeads}>{t('Export lead list')}</Button>
        </header>

        {notice && <p role="status" className="mb-5 text-sm text-slate-600">{notice}</p>}

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-900">{t('Lead pipeline')}</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {leads.map((lead) => {
              const leadKey = `${lead.shop}-${lead.item}`;
              const responding = activeLead === leadKey;

              return (
                <div key={leadKey} className="px-6 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{lead.shop}</div>
                      <div className="text-sm text-slate-500">{lead.item} · {t('Quantity')} {lead.qty}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`badge ${lead.status === 'New' ? 'border-sky-200 bg-sky-50 text-sky-700' : lead.status === 'Quoted' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        {t(lead.status)}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        aria-expanded={responding}
                        onClick={() => {
                          setNotice('');
                          setActiveLead(responding ? null : leadKey);
                          setDraft('');
                        }}
                      >
                        {t(responding ? 'Cancel' : 'Respond')}
                      </Button>
                    </div>
                  </div>
                  {responding && (
                    <form
                      className="mt-4 rounded-xl border border-brand-border bg-slate-50 p-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveResponse(leadKey);
                      }}
                    >
                      <label htmlFor={`response-${leadKey}`} className="mb-2 block text-sm font-medium text-slate-700">
                        {t('Draft a quote response')}
                      </label>
                      <textarea
                        id={`response-${leadKey}`}
                        required
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        className="form-control min-h-24 resize-y"
                        placeholder={t('Enter price, availability, and delivery details')}
                      />
                      <p className="mt-2 text-xs text-slate-500">{t('This demo updates the lead status only; it does not send an email.')}</p>
                      <Button type="submit" size="sm" className="mt-3">{t('Save response')}</Button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
