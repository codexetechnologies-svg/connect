import { requireAppRole } from '@/server/app-account';

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  await requireAppRole('supplier', 'admin');
  return children;
}
