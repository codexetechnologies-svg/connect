export type AccountRole = 'supplier' | 'medical-shop' | 'admin';

export function getRoleRoute(role: AccountRole): string {
  if (role === 'supplier') return '/supplier/catalogue';
  if (role === 'medical-shop') return '/search';
  return '/admin/approvals';
}
