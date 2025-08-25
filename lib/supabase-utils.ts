import { getClientComponentClient } from './supabaseClient'

/**
 * Get public URL for a file stored in Supabase storage
 * @param bucketName - Name of the storage bucket
 * @param filePath - Path to the file in storage
 * @returns Public URL string or null if invalid
 */
export function getSupabasePublicUrl(bucketName: string, filePath: string | null | undefined): string | null {
  if (!filePath) return null
  
  try {
    const supabase = getClientComponentClient()
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  } catch (error) {
    console.error('Error getting public URL:', error)
    return null
  }
}

/**
 * Get public URL specifically for profile avatars
 * @param avatarPath - Path to the avatar file
 * @returns Public URL string or null
 */
export function getAvatarPublicUrl(avatarPath: string | null | undefined): string | null {
  return getSupabasePublicUrl('profiles', avatarPath)
}

/**
 * Get public URL specifically for book cover images
 * @param coverPath - Path to the book cover file
 * @returns Public URL string or null
 */
export function getBookCoverPublicUrl(coverPath: string | null | undefined): string | null {
  return getSupabasePublicUrl('books', coverPath)
}

/**
 * Check if a URL is a blob URL (temporary preview)
 * @param url - URL to check
 * @returns boolean
 */
export function isBlobUrl(url: string | null | undefined): boolean {
  return url ? url.startsWith('blob:') : false
}

/**
 * Get the appropriate image URL for display (handles both blob URLs and storage paths)
 * @param avatarPath - Storage path, blob URL, or full URL
 * @param fallbackUrl - Fallback URL if no avatar
 * @returns Display URL
 */
export function getDisplayAvatarUrl(
  avatarPath: string | null | undefined, 
  fallbackUrl: string = "/placeholder.svg?height=96&width=96"
): string {
  if (!avatarPath) return fallbackUrl
  
  // If it's a blob URL (preview), return as is
  if (isBlobUrl(avatarPath)) {
    return avatarPath
  }
  
  // If it's already a full URL (starts with http:// or https://), return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath
  }
  
  // Convert storage path to public URL
  const publicUrl = getAvatarPublicUrl(avatarPath)
  return publicUrl || fallbackUrl
}

/**
 * Format profile data with proper avatar URLs (for API responses)
 * @param profile - Profile object from database
 * @returns Profile with formatted avatar_url
 */
export function formatProfileWithAvatarUrl<T extends { avatar_url?: string | null }>(profile: T): T {
  if (!profile.avatar_url) return profile
  
  // Check if avatar_url is already a full URL (starts with http:// or https://)
  if (profile.avatar_url.startsWith('http://') || profile.avatar_url.startsWith('https://')) {
    // It's already a full URL, return as is
    return profile
  }
  
  // It's a relative path, convert to public URL
  return {
    ...profile,
    avatar_url: getAvatarPublicUrl(profile.avatar_url) || profile.avatar_url
  }
} 