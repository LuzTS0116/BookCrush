import { useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

/**
 * Custom hook that ensures only one Supabase client instance is created per component
 * This prevents the "Multiple GoTrueClient instances" warning
 */
export function useSupabaseClient() {
  return useMemo(() => getSupabaseBrowserClient(), []);
}
