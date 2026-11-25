import test from 'node:test';
import assert from 'node:assert/strict';
import {
  requestSupabasePasswordReset,
  resendSupabaseSignupEmail,
  updateSupabasePassword
} from './supabase-email.mjs';

const config = {
  baseUrl: 'https://project.supabase.co',
  apiKey: 'public-test-key',
  email: 'person@example.test',
  redirectTo: 'https://connect.example.test/login.html?mode=reset-password'
};

test('resends signup confirmation with an explicit redirect', async () => {
  let requestUrl;
  let requestOptions;
  await resendSupabaseSignupEmail({
    ...config,
    redirectTo: 'https://connect.example.test/login.html?verified=1',
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return Response.json({});
    }
  });

  assert.equal(requestUrl.pathname, '/auth/v1/resend');
  assert.equal(requestUrl.searchParams.get('redirect_to'), 'https://connect.example.test/login.html?verified=1');
  assert.deepEqual(JSON.parse(requestOptions.body), { type: 'signup', email: config.email });
});

test('requests password reset with the configured completion redirect', async () => {
  let requestUrl;
  let requestOptions;
  await requestSupabasePasswordReset({
    ...config,
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return Response.json({});
    }
  });

  assert.equal(requestUrl.pathname, '/auth/v1/recover');
  assert.equal(requestUrl.searchParams.get('redirect_to'), config.redirectTo);
  assert.deepEqual(JSON.parse(requestOptions.body), { email: config.email });
});

test('updates a password using the recovery access token', async () => {
  let requestUrl;
  let requestOptions;
  await updateSupabasePassword({
    ...config,
    accessToken: 'recovery-token',
    password: 'a-new-strong-password',
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return Response.json({});
    }
  });

  assert.equal(requestUrl.pathname, '/auth/v1/user');
  assert.equal(requestOptions.method, 'PUT');
  assert.equal(requestOptions.headers.Authorization, 'Bearer recovery-token');
  assert.deepEqual(JSON.parse(requestOptions.body), { password: 'a-new-strong-password' });
});

test('retains the provider error in server-side errors', async () => {
  await assert.rejects(
    resendSupabaseSignupEmail({
      ...config,
      fetchImpl: async () => Response.json({
        code: 'email_provider_disabled',
        message: 'Error sending confirmation email'
      }, { status: 500 })
    }),
    /Supabase verification email request failed \(500\): email_provider_disabled: Error sending confirmation email/
  );
});
