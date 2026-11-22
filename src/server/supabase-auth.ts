import 'server-only';

import { createClient } from '@supabase/supabase-js';

export class SupabaseAuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAuthConfigurationError';
  }
}

export function getSupabaseAuthClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new SupabaseAuthConfigurationError(
      'SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured.'
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}
