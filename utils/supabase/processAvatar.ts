import { SupabaseClient } from '@supabase/supabase-js';

export function processAvatarUrl(avatarPath: string | null | undefined, supabase: SupabaseClient): string | null {
    if (!avatarPath) return null;
    
    // If already a full URL (Google avatars, etc.), return as-is
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    
    // Convert relative path to public URL synchronously
    if (supabase) {
      const { data } = supabase.storage.from('profiles').getPublicUrl(avatarPath);
      return data.publicUrl;
    }
    
    return null;
  }