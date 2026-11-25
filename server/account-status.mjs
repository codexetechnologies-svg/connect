export function statusAfterEmailVerification(status, role) {
  if (status === 'pending' && ['medical_shop', 'supplier'].includes(role)) {
    return 'approved';
  }
  return status;
}
