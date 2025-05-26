import { createClient } from '@supabase/supabase-js'

// Create the admin client with the service role key
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    
  }
});