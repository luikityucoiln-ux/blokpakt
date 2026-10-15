import type { SupabaseClient } from '@supabase/supabase-js';

let client: Promise<SupabaseClient> | undefined;

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (typeof window === 'undefined') throw new Error('Sign-in is only available in a browser.');
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your-project') || key.includes('your-')) {
    throw new Error('Email sign-in is not configured on this site yet.');
  }
  if (key.startsWith('sb_secret_')) throw new Error('Sign-in configuration is invalid. A public key is required.');
  client = import('@supabase/supabase-js').then(({ createClient }) => createClient(url, key, {
    auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
  })).catch((error: unknown) => {
    client = undefined;
    throw error;
  });
  return client;
}
