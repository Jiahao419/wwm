import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

/**
 * Authenticated client — uses localStorage session for auth.
 * Use for INSERT / UPDATE / DELETE and auth operations.
 */
export function createClient(): SupabaseClient {
  if (client) return client;
  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}

/**
 * Anonymous client — no session, no token refresh.
 * Use for public SELECT queries so they never hang waiting for token refresh.
 */
export function createAnonClient(): SupabaseClient {
  if (anonClient) return anonClient;
  anonClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  return anonClient;
}
