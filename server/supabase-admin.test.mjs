import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deleteSupabaseAuthUser,
  findSupabaseAuthUserIdByEmail
} from './supabase-admin.mjs';

test('finds an exact Supabase Auth email using server-side admin credentials', async () => {
  let requestUrl;
  let requestOptions;
  const userId = 'c0e0a554-22cb-44bd-82e5-5a37bd33ce17';

  const result = await findSupabaseAuthUserIdByEmail({
    baseUrl: 'https://project.supabase.co',
    serviceRoleKey: 'server-only-test-key',
    email: 'owner@example.test',
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return Response.json({
        users: [
          { id: 'c0e0a554-22cb-44bd-82e5-5a37bd33ce18', email: 'owner@example.test.invalid' },
          { id: userId, email: 'OWNER@example.test' }
        ]
      });
    }
  });

  assert.equal(result, userId);
  assert.equal(requestUrl.searchParams.get('filter'), 'owner@example.test');
  assert.equal(requestOptions.headers.Authorization, 'Bearer server-only-test-key');
});

test('treats a missing Auth user as an idempotent deletion and reports provider errors', async () => {
  let deleteMethod;
  await deleteSupabaseAuthUser({
    baseUrl: 'https://project.supabase.co',
    serviceRoleKey: 'server-only-test-key',
    userId: 'c0e0a554-22cb-44bd-82e5-5a37bd33ce17',
    fetchImpl: async (_url, options) => {
      deleteMethod = options.method;
      return new Response(null, { status: 404 });
    }
  });
  assert.equal(deleteMethod, 'DELETE');

  await assert.rejects(
    deleteSupabaseAuthUser({
      baseUrl: 'https://project.supabase.co',
      serviceRoleKey: 'server-only-test-key',
      userId: 'c0e0a554-22cb-44bd-82e5-5a37bd33ce17',
      fetchImpl: async () => new Response(null, { status: 403 })
    }),
    /Supabase admin user deletion failed/
  );
});
