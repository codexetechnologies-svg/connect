import test from 'node:test';
import assert from 'node:assert/strict';
import { statusAfterEmailVerification } from './account-status.mjs';

test('email verification activates pending retailer and distributor accounts', () => {
  assert.equal(statusAfterEmailVerification('pending', 'medical_shop'), 'approved');
  assert.equal(statusAfterEmailVerification('pending', 'supplier'), 'approved');
});

test('email verification does not activate admin or change a non-pending account', () => {
  assert.equal(statusAfterEmailVerification('pending', 'admin'), 'pending');
  assert.equal(statusAfterEmailVerification('rejected', 'supplier'), 'rejected');
  assert.equal(statusAfterEmailVerification('suspended', 'medical_shop'), 'suspended');
  assert.equal(statusAfterEmailVerification('approved', 'supplier'), 'approved');
});
