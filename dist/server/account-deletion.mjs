import { DeleteObjectsCommand } from '@aws-sdk/client-s3';

const DELETE_BATCH_SIZE = 1000;

export function validateAccountKycStorageKeys({ accountId, storageKeys }) {
  if (!Array.isArray(storageKeys)) throw new Error('KYC storage metadata is invalid.');
  const keys = [...new Set(storageKeys)];
  if (keys.some((key) => typeof key !== 'string' || !key.startsWith(`${accountId}/`) || key.length <= accountId.length + 1)) {
    throw new Error('KYC storage metadata does not match the account.');
  }
  return keys;
}

export async function deleteAccountKycObjects({ client, bucket, accountId, storageKeys }) {
  const keys = validateAccountKycStorageKeys({ accountId, storageKeys });

  for (let offset = 0; offset < keys.length; offset += DELETE_BATCH_SIZE) {
    const batch = keys.slice(offset, offset + DELETE_BATCH_SIZE);
    const result = await client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true }
    }));
    if (result.Errors?.length) {
      throw new Error('R2 reported failed KYC document deletions.');
    }
  }

  return keys.length;
}
