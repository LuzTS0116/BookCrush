import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

// Client-side instance (singleton) - using a more robust pattern
let clientInstance: ReturnType<typeof createSupabaseClient> | null = null;

// Server-side instance (singleton)
let serverInstance: ReturnType<typeof createSupabaseClient> | null = null;

// Client component instance (singleton)
let clientComponentInstance: ReturnType<typeof createClientComponentClient> | null = null;

// Lazy initialization - only create when first needed
//let clientInstance: ReturnType<typeof createSupabaseClient> | null = null;

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

export const createServerClient = (cookies: any, headers: any) => {
  return createPagesServerClient({ cookies, headers });
}

export const getClientComponentClient = () => {
  if (!clientComponentInstance) {
    clientComponentInstance = createClientComponentClient();
  }
  return clientComponentInstance;
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
  clientComponentInstance = null;
}

