import { requireAppRole } from '@/server/app-account';

export default async function MapLayout({ children }: { children: React.ReactNode }) {
  await requireAppRole('medical-shop', 'admin');
  return children;
}
