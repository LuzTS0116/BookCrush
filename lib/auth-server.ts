// lib/auth-server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Ensure @supabase/ssr is installed
import type { NextRequest } from 'next/server';

// Ensure this file (lib/database.types.ts) exists if you use <Database> generic type, otherwise remove the generic.
// import { Database } from './database.types'; 

export async function getUserFromApiRequest(request: NextRequest | Request) {
  // console.log('[getUserFromApiRequest] Initializing Supabase client for API request.');

  const supabase = createServerClient( // If using <Database>, it would be createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookieHeader = request.headers.get('cookie');
          // console.log(`[CookieGetter for "${name}"] Raw header: "${cookieHeader?.substring(0, 200)}..."`);
          if (!cookieHeader) {
            // console.log(`[CookieGetter for "${name}"] Cookie header missing.`);
            return undefined;
          }
          const nameEscaped = name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
          const regex = new RegExp(`(?:^|;\\s*)${nameEscaped}=([^;]*)`);
          const match = cookieHeader.match(regex);
          const value = match ? match[1] : undefined;
          // console.log(`[CookieGetter for "${name}"] Regex: "${regex}". Match found: ${!!match}. Value: "${value?.substring(0,100)}..."`);
          return value;
        },
        set: (name: string, value: string, options: CookieOptions) => {
          // console.warn(`[CookieSetter for "${name}"] Set called in read-only context for API check.`);
        },
        remove: (name: string, options: CookieOptions) => {
          // console.warn(`[CookieRemover for "${name}"] Remove called in read-only context for API check.`);
        },
      },
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('[getUserFromApiRequest] Supabase auth.getUser() error:', error.message);
      return { user: null, error: { type: 'SUPABASE_ERROR', message: `Supabase error: ${error.message}` } };
    }
    if (!user) {
      // console.log('[getUserFromApiRequest] No user object returned by supabase.auth.getUser().');
      return { user: null, error: { type: 'NO_USER', message: 'No authenticated user session resolved by Supabase (getUserFromApiRequest).' } };
    }
    // console.log('[getUserFromApiRequest] User successfully retrieved from API request:', user.id);
    return { user, error: null };
  } catch (e: any) {
    console.error('[getUserFromApiRequest] Exception during supabase.auth.getUser():', e.message);
    return { user: null, error: { type: 'EXCEPTION', message: `Exception: ${e.message || 'An unexpected error occurred.'}` } };
  }
}
