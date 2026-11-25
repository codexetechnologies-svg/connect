export class SupabaseAuthError extends Error {
  constructor(response, payload, operation) {
    const code = [payload?.code, payload?.error_code, payload?.error]
      .find((value) => typeof value === 'string');
    const message = [payload?.msg, payload?.message, payload?.error_description]
      .find((value) => typeof value === 'string');
    const details = [code, message].filter(Boolean).join(': ');
    super(`Supabase ${operation} failed (${response.status})${details ? `: ${details}` : ''}`);
    this.name = 'SupabaseAuthError';
    this.status = response.status;
    this.code = code;
    this.providerMessage = message;
  }
}

async function requestSupabaseAuth({
  baseUrl,
  apiKey,
  path,
  redirectTo,
  method = 'POST',
  body,
  accessToken,
  operation,
  fetchImpl = fetch
}) {
  if (!baseUrl || !apiKey) {
    throw new Error('Supabase email configuration is incomplete.');
  }
  const url = new URL(path, baseUrl);
  if (redirectTo) url.searchParams.set('redirect_to', redirectTo);
  const headers = {
    apikey: apiKey,
    'Content-Type': 'application/json'
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetchImpl(url, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new SupabaseAuthError(response, payload, operation);
  }
  return response.status === 204 ? null : response.json().catch(() => null);
}

export function resendSupabaseSignupEmail({ baseUrl, apiKey, email, redirectTo, fetchImpl }) {
  return requestSupabaseAuth({
    baseUrl,
    apiKey,
    path: '/auth/v1/resend',
    redirectTo,
    body: { type: 'signup', email },
    operation: 'verification email request',
    fetchImpl
  });
}

export function requestSupabasePasswordReset({ baseUrl, apiKey, email, redirectTo, fetchImpl }) {
  return requestSupabaseAuth({
    baseUrl,
    apiKey,
    path: '/auth/v1/recover',
    redirectTo,
    body: { email },
    operation: 'password reset email request',
    fetchImpl
  });
}

export function updateSupabasePassword({ baseUrl, apiKey, accessToken, password, fetchImpl }) {
  return requestSupabaseAuth({
    baseUrl,
    apiKey,
    path: '/auth/v1/user',
    method: 'PUT',
    accessToken,
    body: { password },
    operation: 'password update',
    fetchImpl
  });
}
