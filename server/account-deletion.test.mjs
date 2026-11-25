import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteAccountKycObjects } from './account-deletion.mjs';

test('deletes unique account-owned KYC objects in provider-sized batches', async () => {
  const accountId = 'c0e0a554-22cb-44bd-82e5-5a37bd33ce17';
  const storageKeys = Array.from({ length: 1001 }, (_, index) => `${accountId}/${index}`);
  const inputs = [];
  const client = {
    async send(command) {
      inputs.push(command.input);
      return {};
    }
  };

  const deletedCount = await deleteAccountKycObjects({
    client,
    bucket: 'private-documents',
    accountId,
    storageKeys: [...storageKeys, storageKeys[0]]
  });

  assert.equal(deletedCount, 1001);
  assert.deepEqual(inputs.map((input) => input.Delete.Objects.length), [1000, 1]);
  assert.equal(inputs[0].Bucket, 'private-documents');
});

test('refuses cross-account keys and surfaces storage deletion failures', async () => {
  let sendCount = 0;
  const client = {
    async send() {
      sendCount += 1;
      return { Errors: [{ Key: 'failed' }] };
    }
  };
  const accountId = 'c0e0a554-22cb-44bd-82e5-5a37bd33ce17';

  await assert.rejects(
    deleteAccountKycObjects({
      client,
      bucket: 'private-documents',
      accountId,
      storageKeys: [`${accountId}/document`, 'another-account/document']
    }),
    /does not match the account/
  );
  assert.equal(sendCount, 0);

  await assert.rejects(
    deleteAccountKycObjects({
      client,
      bucket: 'private-documents',
      accountId,
      storageKeys: [`${accountId}/document`]
    }),
    /failed KYC document deletions/
  );
});
