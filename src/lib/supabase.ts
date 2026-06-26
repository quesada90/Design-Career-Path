import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
  }
  // In development, warn and fall through — allows the app to boot without a DB for UI work
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
    'Database operations will fail.'
  );
}

const url = supabaseUrl ?? 'https://placeholder.supabase.co';
const anonKey = supabaseAnonKey ?? 'placeholder-anon-key';

/**
 * Default Supabase client for authenticated users.
 */
export const supabase = createClient(url, anonKey);

/**
 * Returns a Supabase client with an optional share token injected as a custom
 * request header. Supabase RLS policies read `x-share-token` to grant
 * read-only access to anonymous manager views.
 */
export function getSupabaseClient(shareToken?: string) {
  if (!shareToken) return supabase;

  return createClient(url, anonKey, {
    global: { headers: { 'x-share-token': shareToken } },
    auth: { persistSession: false },
  });
}

export type SupabaseClientType = ReturnType<typeof getSupabaseClient>;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Privileged admin client that bypasses Row-Level Security.
 * Only instantiated server-side — never exposed to the client.
 */
export const supabaseAdmin =
  typeof window === 'undefined' && supabaseServiceKey
    ? createClient(url, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : supabase;
