import { createClient } from '@supabase/supabase-js';

/**
 * Supabase server client for use in API routes and server components
 * Uses service role key for elevated permissions (admin operations)
 * IMPORTANT: Never expose SERVICE_ROLE_KEY to the client!
 */

let serverInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseServerClient() {
  if (!serverInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    serverInstance = createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  return serverInstance;
}

/**
 * Get a Supabase client with a specific user's JWT token
 * Used for server-side operations that respect user's RLS policies
 */
export function getSupabaseClientWithAuth(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  const client = createClient(supabaseUrl, supabaseAnonKey);
  client.auth.setSession({
    access_token: token,
    refresh_token: '',
    token_type: 'bearer',
    expires_in: 3600,
    user: null as any,
  });

  return client;
}

export type SupabaseServerClient = ReturnType<typeof getSupabaseServerClient>;
