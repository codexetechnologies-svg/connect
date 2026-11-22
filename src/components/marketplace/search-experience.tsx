'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { searchResults, type Supplier } from '@/lib/data/mock-data';
import { useLanguage } from '@/features/i18n/language-provider';

export function SearchExperience() {
  const { t } = useLanguage();
  const resultsRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('Paracetamol 650mg');
  const [brand, setBrand] = useState('all');
  const [pack, setPack] = useState('all');
  const [distance, setDistance] = useState('50');
  const [compared, setCompared] = useState(false);

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return searchResults.filter((supplier: Supplier) => {
      const searchable = [
        'Paracetamol 650mg Tablet',
        supplier.name,
        supplier.city,
        supplier.brand,
        supplier.pack
      ].join(' ').toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (brand === 'all' || (brand === 'generic' ? supplier.brand === 'Generic' : supplier.brand !== 'Generic')) &&
        (pack === 'all' || supplier.pack === pack) &&
        supplier.distanceKm <= Number(distance)
      );
    });
  }, [brand, distance, pack, query]);

  function compareSuppliers() {
    setCompared(true);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <section className="card p-5 sm:p-6" aria-labelledby="medicine-search-title">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="page-eyebrow">{t('Medicine search')}</p>
            <h2 id="medicine-search-title" className="mt-2 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
              Paracetamol 650 mg Tablet
            </h2>
          </div>
          <Button type="button" onClick={compareSuppliers}>{t('Compare suppliers')}</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="medicine-query" className="mb-2 block text-sm font-medium text-slate-700">
            {t('Medicine, supplier or city')}
            </label>
            <input
              id="medicine-query"
              className="form-control"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCompared(false);
              }}
            />
          </div>
          <div>
            <label htmlFor="brand-filter" className="mb-2 block text-sm font-medium text-slate-700">
              {t('Brand / generic')}
            </label>
            <select id="brand-filter" className="form-control" value={brand} onChange={(event) => setBrand(event.target.value)}>
              <option value="all">{t('All')}</option>
              <option value="branded">{t('Branded')}</option>
              <option value="generic">{t('Generic')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="pack-filter" className="mb-2 block text-sm font-medium text-slate-700">
              {t('Pack size')}
            </label>
            <select id="pack-filter" className="form-control" value={pack} onChange={(event) => setPack(event.target.value)}>
              <option value="all">{t('All pack sizes')}</option>
              <option value="Strip of 10">{t('Strip of 10')}</option>
              <option value="Strip of 15">{t('Strip of 15')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="distance-filter" className="mb-2 block text-sm font-medium text-slate-700">
              {t('Maximum distance')}
            </label>
            <select id="distance-filter" className="form-control" value={distance} onChange={(event) => setDistance(event.target.value)}>
              <option value="20">{t('Within 20 km')}</option>
              <option value="50">{t('Within 50 km')}</option>
            </select>
          </div>
        </div>
      </section>

      <section id="price-comparison" ref={resultsRef} className="card overflow-hidden scroll-mt-6">
        <div className="border-b border-brand-border bg-slate-50 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-slate-900">{t('Exact-match price comparison')}</h2>
            <span className="text-sm text-slate-600" aria-live="polite">
              {filteredSuppliers.length} {t(filteredSuppliers.length === 1 ? 'supplier' : 'suppliers')} {t('found')}
            </span>
          </div>
          {compared && (
            <p role="status" className="mt-2 text-sm font-medium text-brand-emerald">
              {t('Comparison updated with your selected filters.')}
            </p>
          )}
        </div>
        {filteredSuppliers.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-600">
            {t('No suppliers match those filters. Try a broader search or distance.')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="responsive-table">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">{t('Supplier')}</th>
                  <th scope="col" className="px-6 py-3 font-medium">{t('Distance')}</th>
                  <th scope="col" className="px-6 py-3 font-medium">{t('Stock')}</th>
                  <th scope="col" className="px-6 py-3 font-medium">{t('Rate')}</th>
                  <th scope="col" className="px-6 py-3 font-medium">{t('GST')}</th>
                  <th scope="col" className="px-6 py-3 font-medium">{t('Scheme')}</th>
                  <th scope="col" className="px-6 py-3 font-medium">{t('Effective')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="bg-white hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{supplier.name}</div>
                      <div className="text-xs text-slate-500">{t(supplier.verified ? 'Verified licence' : 'Pending verification')}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{supplier.distanceKm} km</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${supplier.stock === 'In Stock' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : supplier.stock === 'Low Stock' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                        {t(supplier.stock)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-900">₹{supplier.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-700">{supplier.gst}%</td>
                    <td className="px-6 py-4 text-slate-700">{supplier.scheme}</td>
                    <td className="px-6 py-4 font-semibold text-brand-navy">₹{(supplier.price * (1 + supplier.gst / 100)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
