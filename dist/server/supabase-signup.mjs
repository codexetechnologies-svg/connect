import { SupabaseAuthError } from './supabase-email.mjs';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isAlreadyRegistered(payload) {
  const code = payload?.code || payload?.error_code || payload?.error;
  const message = [payload?.msg, payload?.message, payload?.error_description]
    .filter((value) => typeof value === 'string')
    .join(' ');
  return ['user_already_exists', 'email_exists', 'user_already_registered'].includes(code) ||
    /user already registered|email already exists/i.test(message);
}

export async function signupSupabaseUser({
  baseUrl,
  apiKey,
  email,
  password,
  fullName,
  phone,
  redirectTo,
  fetchImpl = fetch
}) {
  if (!baseUrl || !apiKey || !email || !password || !fullName || !redirectTo) {
    throw new Error('Supabase sign-up configuration is incomplete.');
  }

  const url = new URL('/auth/v1/signup', baseUrl);
  url.searchParams.set('redirect_to', redirectTo);
  const metadata = { full_name: fullName };
  if (phone) metadata.phone = phone;

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, data: metadata }),
    signal: AbortSignal.timeout(8000)
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if ([400, 409, 422].includes(response.status) && isAlreadyRegistered(payload)) return null;
    throw new SupabaseAuthError(response, payload, 'sign-up');
  }

  const user = payload?.user;
  if (Array.isArray(user?.identities) && user.identities.length === 0) return null;
  if (
    !user ||
    typeof user.id !== 'string' ||
    !UUID_PATTERN.test(user.id) ||
    typeof user.email !== 'string' ||
    user.email.toLowerCase() !== email.toLowerCase()
  ) {
    throw new Error('Supabase sign-up returned an invalid user.');
  }

  return user;
}

export async function signInSupabaseUser({
  baseUrl,
  apiKey,
  email,
  password,
  fetchImpl = fetch
}) {
  if (!baseUrl || !apiKey || !email || !password) {
    throw new Error('Supabase sign-in configuration is incomplete.');
  }

  const url = new URL('/auth/v1/token', baseUrl);
  url.searchParams.set('grant_type', 'password');
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(8000)
  });
  const payload = await response.json().catch(() => null);

  if (response.status === 400 || response.status === 401) return null;
  if (!response.ok) throw new Error(`Supabase sign-in failed (${response.status}).`);

  const user = payload?.user;
  if (
    !user ||
    typeof user.id !== 'string' ||
    !UUID_PATTERN.test(user.id) ||
    typeof user.email !== 'string' ||
    user.email.toLowerCase() !== email.toLowerCase()
  ) {
    throw new Error('Supabase sign-in returned an invalid user.');
  }

  return user.email_confirmed_at ? user : null;
}
