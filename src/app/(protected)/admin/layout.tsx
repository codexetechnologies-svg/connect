import { requireAppRole } from '@/server/app-account';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAppRole('admin');
  return children;
}
