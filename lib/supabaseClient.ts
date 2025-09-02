import { createClient as createSupabaseClient } from '@supabase/supabase-js'


// Client-side instance (singleton) - using a more robust pattern
let clientInstance: ReturnType<typeof createSupabaseClient> | null = null;

// Server-side instance (singleton)
let serverInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
  if (!clientInstance) {
    clientInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'supabase-auth',
        }
      }
    )
  }
  return clientInstance;
}

export const createServerClientWithToken = (accessToken?: string) => {
  // Always create a new instance for server-side operations with tokens
  // This is necessary because each request may have different tokens
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      ...(accessToken && {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }),
    }
  );
}

// Clean up function for testing purposes
export const clearInstances = () => {
  clientInstance = null;
  serverInstance = null;
}

