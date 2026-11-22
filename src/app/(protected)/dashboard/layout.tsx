import { requireAppRole } from '@/server/app-account';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAppRole('supplier', 'medical-shop', 'admin');
  return children;
}
