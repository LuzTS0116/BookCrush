'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function SupabaseBridge({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const supabase = getSupabaseBrowserClient()

  // Track last applied tokens to avoid redundant setSession calls
  const lastTokensRef = useRef<{ at?: string; rt?: string }>({})

  useEffect(() => {
    if (status !== 'authenticated') {
      // IMPORTANT: do not auto signOut here. Only sign out on explicit user action.
      return
    }

    const at = session?.supabaseAccessToken
    const rt = session?.supabaseRefreshToken
    if (!at || !rt) return

    if (lastTokensRef.current.at === at && lastTokensRef.current.rt === rt) return
    lastTokensRef.current = { at, rt }

    supabase.auth.setSession({ access_token: at, refresh_token: rt })
      .catch((e) => console.warn('[SupabaseBridge] setSession failed', e))
  }, [status, session?.supabaseAccessToken, session?.supabaseRefreshToken, supabase])

  return <>{children}</>
}