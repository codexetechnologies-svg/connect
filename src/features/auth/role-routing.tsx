import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function RoleRoutingCard() {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Role routing</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Choose the right portal</h3>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-[#0B3B60]">Supplier</p>
          <p className="mt-2 text-sm text-slate-600">Catalogue management, price updates, and enquiry handling.</p>
          <Button asChild variant="primary" size="sm" className="mt-4">
            <Link href="/supplier/catalogue">Open supplier portal</Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-[#0B3B60]">Medical Shop</p>
          <p className="mt-2 text-sm text-slate-600">Compare suppliers, review stocks, and request quotes.</p>
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link href="/search">Open shop portal</Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-[#0B3B60]">Admin</p>
          <p className="mt-2 text-sm text-slate-600">Approve KYC, manage subscriptions, and monitor platform health.</p>
          <Button asChild variant="success" size="sm" className="mt-4">
            <Link href="/admin/approvals">Open admin panel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
