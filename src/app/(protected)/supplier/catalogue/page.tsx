'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { catalogRows } from '@/lib/data/mock-data';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/features/i18n/language-provider';

type CatalogRow = {
  medicine: string;
  composition: string;
  brand: string;
  pack: string;
  basePrice: number;
  stock: string;
};

function parseCsvLine(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

export default function SupplierCataloguePage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedRows, setImportedRows] = useState<CatalogRow[]>([]);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImportMessage('');
    setImportError(false);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportMessage(t('Please choose a CSV file. Excel workbook files are not supported in this demo.'));
      setImportError(true);
      return;
    }

    try {
      const rows = parseCsvLine(await file.text());
      const headers = rows.shift()?.map((header) => header.toLowerCase().replace(/[\s_-]+/g, '')) ?? [];
      const columns = ['medicine', 'composition', 'brand', 'pack', 'baseprice', 'stock'];
      const indexes = columns.map((column) => headers.indexOf(column));

      if (indexes.some((index) => index < 0)) {
        throw new Error(t('CSV headers must be medicine, composition, brand, pack, basePrice, and stock.'));
      }

      const parsedRows: CatalogRow[] = rows.map((row, rowIndex) => {
        const values = indexes.map((index) => row[index] ?? '');
        const basePrice = Number(values[4]);

        if (values.slice(0, 4).some((value) => !value) || !Number.isFinite(basePrice) || basePrice < 0 || !values[5]) {
          throw new Error(t('Row validation failed').replace('{row}', String(rowIndex + 2)));
        }

        return {
          medicine: values[0],
          composition: values[1],
          brand: values[2],
          pack: values[3],
          basePrice,
          stock: values[5]
        };
      });

      if (parsedRows.length === 0) throw new Error(t('The CSV has headers but no catalogue rows.'));
      setImportedRows((current) => [...current, ...parsedRows]);
      const message = parsedRows.length === 1
        ? 'Added {count} row to this page. Demo changes are not saved to a server.'
        : 'Added {count} rows to this page. Demo changes are not saved to a server.';
      setImportMessage(t(message).replace('{count}', String(parsedRows.length)));
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : t('The CSV file could not be read.'));
      setImportError(true);
    }
  }

  const rows: CatalogRow[] = [...catalogRows, ...importedRows];

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-eyebrow">{t('Supplier portal')}</p>
            <h1 className="page-title">{t('Catalogue and pricing')}</h1>
          </div>
          <div className="flex min-w-0 flex-col items-start gap-2 sm:items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="sr-only"
              aria-label={t('Choose catalogue CSV')}
            />
            <Button type="button" variant="success" onClick={() => fileInputRef.current?.click()}>
              {t('Import CSV')}
            </Button>
            <p className="break-words text-left text-xs text-slate-500 sm:text-right">
              {t('Columns: medicine, composition, brand, pack, basePrice, stock')}
            </p>
          </div>
        </header>

        {importMessage && (
          <p
            role={importError ? 'alert' : 'status'}
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              importError
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {importMessage}
          </p>
        )}

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-900">{t('Active medicine SKUs')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="responsive-table">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('Medicine')}</th>
                  <th className="px-6 py-3 font-medium">{t('Composition')}</th>
                  <th className="px-6 py-3 font-medium">{t('Brand')}</th>
                  <th className="px-6 py-3 font-medium">{t('Pack')}</th>
                  <th className="px-6 py-3 font-medium">{t('Base price')}</th>
                  <th className="px-6 py-3 font-medium">{t('Stock')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row, index) => (
                  <tr key={`${row.medicine}-${index}`} className="bg-white hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{row.medicine}</td>
                    <td className="px-6 py-4 text-slate-700">{row.composition}</td>
                    <td className="px-6 py-4 text-slate-700">{row.brand}</td>
                    <td className="px-6 py-4 text-slate-700">{row.pack}</td>
                    <td className="px-6 py-4 font-mono text-slate-900">₹{row.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${row.stock === 'In Stock' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        {t(row.stock)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
