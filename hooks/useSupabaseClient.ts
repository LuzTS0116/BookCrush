import { useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';

/**
 * Custom hook that ensures only one Supabase client instance is created per component
 * This prevents the "Multiple GoTrueClient instances" warning
 */
export function useSupabaseClient() {
  return useMemo(() => createClient(), []);
}
