import test from 'node:test';
import assert from 'node:assert/strict';
import { signInSupabaseUser, signupSupabaseUser } from './supabase-signup.mjs';

const userId = 'c0e0a554-22cb-44bd-82e5-5a37bd33ce17';

test('creates a Supabase user with a first-party email verification redirect', async () => {
  let requestUrl;
  let requestOptions;
  const result = await signupSupabaseUser({
    baseUrl: 'https://project.supabase.co',
    apiKey: 'public-test-key',
    email: 'person@example.test',
    password: 'strong-test-password',
    fullName: 'Test Person',
    phone: '+919876543210',
    redirectTo: 'https://connect.example.test/login.html?verified=1',
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return Response.json({
        user: {
          id: userId,
          email: 'person@example.test',
          identities: [{ id: userId }]
        }
      });
    }
  });

  assert.equal(result.id, userId);
  assert.equal(requestUrl.pathname, '/auth/v1/signup');
  assert.equal(requestUrl.searchParams.get('redirect_to'), 'https://connect.example.test/login.html?verified=1');
  assert.equal(requestOptions.headers.apikey, 'public-test-key');
  assert.deepEqual(JSON.parse(requestOptions.body), {
    email: 'person@example.test',
    password: 'strong-test-password',
    data: { full_name: 'Test Person', phone: '+919876543210' }
  });
});

test('does not disclose whether a Supabase email already has an identity', async () => {
  const duplicate = await signupSupabaseUser({
    baseUrl: 'https://project.supabase.co',
    apiKey: 'public-test-key',
    email: 'person@example.test',
    password: 'strong-test-password',
    fullName: 'Test Person',
    redirectTo: 'https://connect.example.test/login.html?verified=1',
    fetchImpl: async () => Response.json({
      user: { id: userId, email: 'person@example.test', identities: [] }
    })
  });
  assert.equal(duplicate, null);

  const duplicateError = await signupSupabaseUser({
    baseUrl: 'https://project.supabase.co',
    apiKey: 'public-test-key',
    email: 'person@example.test',
    password: 'strong-test-password',
    fullName: 'Test Person',
    redirectTo: 'https://connect.example.test/login.html?verified=1',
    fetchImpl: async () => Response.json({
      code: 'user_already_exists',
      message: 'User already registered'
    }, { status: 422 })
  });
  assert.equal(duplicateError, null);
});

test('authenticates an existing confirmed identity without exposing its session', async () => {
  let requestUrl;
  const result = await signInSupabaseUser({
    baseUrl: 'https://project.supabase.co',
    apiKey: 'public-test-key',
    email: 'person@example.test',
    password: 'strong-test-password',
    fetchImpl: async (url, options) => {
      requestUrl = url;
      assert.deepEqual(JSON.parse(options.body), {
        email: 'person@example.test',
        password: 'strong-test-password'
      });
      return Response.json({
        access_token: 'session-token',
        user: {
          id: userId,
          email: 'person@example.test',
          email_confirmed_at: '2026-01-01T00:00:00Z'
        }
      });
    }
  });

  assert.equal(requestUrl.pathname, '/auth/v1/token');
  assert.equal(requestUrl.searchParams.get('grant_type'), 'password');
  assert.deepEqual(result, {
    id: userId,
    email: 'person@example.test',
    email_confirmed_at: '2026-01-01T00:00:00Z'
  });
});

test('does not link invalid or unconfirmed Supabase identities', async () => {
  const input = {
    baseUrl: 'https://project.supabase.co',
    apiKey: 'public-test-key',
    email: 'person@example.test',
    password: 'strong-test-password'
  };
  const invalidCredentials = await signInSupabaseUser({
    ...input,
    fetchImpl: async () => Response.json({ error: 'invalid_grant' }, { status: 400 })
  });
  const unconfirmed = await signInSupabaseUser({
    ...input,
    fetchImpl: async () => Response.json({
      user: { id: userId, email: 'person@example.test', email_confirmed_at: null }
    })
  });

  assert.equal(invalidCredentials, null);
  assert.equal(unconfirmed, null);
});

test('rejects malformed Auth responses and provider errors without leaking response bodies', async () => {
  const input = {
    baseUrl: 'https://project.supabase.co',
    apiKey: 'public-test-key',
    email: 'person@example.test',
    password: 'strong-test-password',
    fullName: 'Test Person',
    redirectTo: 'https://connect.example.test/login.html?verified=1'
  };

  await assert.rejects(
    signupSupabaseUser({ ...input, fetchImpl: async () => Response.json({ user: { id: 'not-a-uuid' } }) }),
    /invalid user/
  );
  await assert.rejects(
    signupSupabaseUser({
      ...input,
      fetchImpl: async () => Response.json({
        message: 'Error sending confirmation email'
      }, { status: 500 })
    }),
    /Supabase sign-up failed \(500\): Error sending confirmation email/
  );
});
