import { requireAppRole } from '@/server/app-account';

export default async function SearchLayout({ children }: { children: React.ReactNode }) {
  await requireAppRole('medical-shop', 'admin');
  return children;
}
