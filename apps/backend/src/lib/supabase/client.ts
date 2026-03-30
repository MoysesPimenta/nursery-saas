import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client factory for use in client components and browser environments
 * Uses public anon key for client-side authentication
 */

let clientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
    }

    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return clientInstance;
}

export type SupabaseClient = ReturnType<typeof getSupabaseClient>;
