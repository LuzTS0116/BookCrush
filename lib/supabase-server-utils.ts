import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Server-side utility to get public URL for Supabase storage files
 * @param bucketName - Name of the storage bucket
 * @param filePath - Path to the file in storage
 * @returns Public URL string or null if invalid
 */
export async function getSupabasePublicUrlServer(bucketName: string, filePath: string | null | undefined): Promise<string | null> {
  if (!filePath) return null
  
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  } catch (error) {
    console.error('Error getting public URL (server):', error)
    return null
  }
}

/**
 * Server-side utility to get avatar public URL
 * @param avatarPath - Path to the avatar file
 * @returns Public URL string or null
 */
export async function getAvatarPublicUrlServer(avatarPath: string | null | undefined): Promise<string | null> {
  return getSupabasePublicUrlServer('profiles', avatarPath)
}

/**
 * Server-side utility to format profile data with proper avatar URLs
 * @param profile - Profile object from database
 * @returns Profile with formatted avatar_url
 */
export async function formatProfileWithAvatarUrlServer<T extends { avatar_url?: string | null }>(profile: T): Promise<T> {
  if (!profile.avatar_url) return profile
  
  // Check if avatar_url is already a full URL (starts with http:// or https://)
  if (profile.avatar_url.startsWith('http://') || profile.avatar_url.startsWith('https://')) {
    // It's already a full URL, return as is
    return profile
  }
  
  // It's a relative path, convert to public URL
  const publicUrl = await getAvatarPublicUrlServer(profile.avatar_url)
  
  return {
    ...profile,
    avatar_url: publicUrl || profile.avatar_url
  }
} 