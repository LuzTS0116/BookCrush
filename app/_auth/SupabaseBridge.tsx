// 'use client'
// import { useSession } from 'next-auth/react'
// import { useEffect } from 'react'
// import { supabaseBrowser } from '@/lib/supabase' // <── helper from step 3

// export default function SupabaseBridge(
// { children }: { children: React.ReactNode }
// ) {
// const { data: session } = useSession()
// const supabase = supabaseBrowser()

// useEffect(() => {
// if (session?.supabaseAccessToken) {
// supabase.auth.setSession({
// access_token: session.supabaseAccessToken,
// refresh_token: session.supabaseRefreshToken ?? '',
// })
// } else {
// supabase.auth.signOut()
// }
// }, [session])

// return <>{children}</>
// }

'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { supabaseBrowser } from '@/lib/supabase'

export default function SupabaseBridge(
{ children }: { children: React.ReactNode }
) {
const { data: session } = useSession()

/* 1. create the client only once – and only in the browser */
const supabaseRef = useRef<ReturnType>()

if (typeof window !== 'undefined' && !supabaseRef.current) {
supabaseRef.current = createBrowserSupabaseClient({
supabaseUrl : process.env.NEXT_PUBLIC_SUPABASE_URL!,
supabaseKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
})
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