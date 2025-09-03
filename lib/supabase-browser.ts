'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    // client = createClientComponentClient({
    //   // Optional: helps suppress multi-client warnings in dev
    //   // options: { auth: { multiTab: false } },
    // })
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return client
}
