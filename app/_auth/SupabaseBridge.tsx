'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function SupabaseBridge(
{ children }: { children: React.ReactNode }
) {
const { data: session } = useSession()

/* 1. create the client only once – and only in the browser */
const supabaseRef = useRef<SupabaseClient>()

if (typeof window !== 'undefined' && !supabaseRef.current) {
supabaseRef.current = createClientComponentClient({})
}

/* 2. keep the Supabase session in-sync with the Next-Auth session */
useEffect(() => {
const supabase = supabaseRef.current
if (!supabase) return // still SSR

if (session?.supabaseAccessToken) {
  supabase.auth.setSession({
    access_token : session.supabaseAccessToken,
    refresh_token: session.supabaseRefreshToken ?? '',
  })
} else {
  supabase.auth.signOut()
}

}, [session])

return <>{children}</>
}