import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;
  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Add 10s timeout to ALL Supabase network requests (including token refresh)
        // This prevents the client from hanging forever if a request stalls
        fetch: (url: RequestInfo | URL, options?: RequestInit) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeout));
        },
      },
    }
  );
  return client;
}
