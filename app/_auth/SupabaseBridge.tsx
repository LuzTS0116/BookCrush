'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useSupabase } from '@/lib/SupabaseContext'

export default function SupabaseBridge(
{ children }: { children: React.ReactNode }
) {
const { data: session } = useSession()
const supabase = useSupabase()

/* 2. keep the Supabase session in-sync with the Next-Auth session */
useEffect(() => {
if (session?.supabaseAccessToken) {
  supabase.auth.setSession({
    access_token : session.supabaseAccessToken,
    refresh_token: session.supabaseRefreshToken ?? '',
  })
} else {
  supabase.auth.signOut()
}

}, [session, supabase])

return <>{children}</>
}