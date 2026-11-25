const USERS_PER_PAGE = 1000;
const MAX_USER_PAGES = 100;

function adminHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json'
  };
}

export async function findSupabaseAuthUserIdByEmail({ baseUrl, serviceRoleKey, email, fetchImpl = fetch }) {
  if (!baseUrl || !serviceRoleKey || !email) throw new Error('Supabase admin configuration is incomplete.');
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const url = new URL('/auth/v1/admin/users', baseUrl);
    url.search = new URLSearchParams({
      page: String(page),
      per_page: String(USERS_PER_PAGE),
      filter: email
    });
    const response = await fetchImpl(url, {
      headers: adminHeaders(serviceRoleKey),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`Supabase admin user lookup failed (${response.status}).`);

    const payload = await response.json();
    if (!Array.isArray(payload.users)) throw new Error('Supabase admin user response was malformed.');
    const user = payload.users.find((candidate) =>
      typeof candidate.email === 'string' && candidate.email.toLowerCase() === normalizedEmail
    );
    if (user) {
      if (typeof user.id !== 'string') throw new Error('Supabase admin user ID was malformed.');
      return user.id;
    }
    if (payload.users.length < USERS_PER_PAGE) return null;
  }

  throw new Error('Supabase admin user lookup exceeded the safe pagination limit.');
}

export async function deleteSupabaseAuthUser({ baseUrl, serviceRoleKey, userId, fetchImpl = fetch }) {
  if (!baseUrl || !serviceRoleKey || !userId) throw new Error('Supabase admin configuration is incomplete.');
  const url = new URL(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, baseUrl);
  const response = await fetchImpl(url, {
    method: 'DELETE',
    headers: adminHeaders(serviceRoleKey),
    signal: AbortSignal.timeout(8000)
  });
  if (response.status === 404) return;
  if (!response.ok) throw new Error(`Supabase admin user deletion failed (${response.status}).`);
}
