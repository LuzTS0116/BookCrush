'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { createClient } from './supabaseClient'
import type { SupabaseClient } from '@supabase/supabase-js'

interface SupabaseContextType {
  supabase: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Create a single Supabase client instance that will be shared across all components
  const supabase = useMemo(() => createClient(), [])

  const value = useMemo(() => ({ supabase }), [supabase])

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context.supabase
}
