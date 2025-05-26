import { createClient as createSupabaseClient } from '@supabase/supabase-js'
// import { createClient as createPagesServerClient } from '@supabase/supabase-js'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true, // Ensure this is true
        storageKey: 'supabase-auth', // Custom storage key
      }
    }
  )
}

export const createServerClient = (cookies, headers) =>
createPagesServerClient({ cookies, headers });

