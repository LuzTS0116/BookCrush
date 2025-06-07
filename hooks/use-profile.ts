import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { getDisplayAvatarUrl } from '@/lib/supabase-utils'

interface Profile {
  id: string
  display_name: string
  nickname?: string
  avatar_url?: string
  email?: string
}

// Fetcher function for SWR
const profileFetcher = async (url: string): Promise<Profile> => {
  const response = await fetch(url, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile')
  }
  
  return response.json()
}

/**
 * Profile hook with SWR for optimal performance in navigation components
 * - Caches data for 5 minutes to reduce API calls
 * - Uses session data as fallback for instant loading
 * - Automatically updates when user returns to tab
 * - Perfect for navigation components
 */
export function useProfile() {
  const { data: session, status } = useSession()
  
  // Only fetch profile if user is authenticated
  const shouldFetch = status === 'authenticated' && session?.user
  
  const { data: profile, error, mutate, isLoading } = useSWR<Profile>(
    shouldFetch ? '/api/profile' : null,
    profileFetcher,
    {
      // Cache for 5 minutes - good balance for nav component
      dedupingInterval: 5 * 60 * 1000,
      // Revalidate on focus (when user comes back to tab)
      revalidateOnFocus: true,
      // Don't revalidate on reconnect for nav (not critical)
      revalidateOnReconnect: false,
      // Cache errors for 30 seconds to avoid spam
      errorRetryInterval: 30 * 1000,
      // Fallback to session data while loading for instant UI
      fallbackData: session?.user ? {
        id: '',
        display_name: session.user.name || '',
        email: session.user.email || '',
        avatar_url: session.user.image || undefined
      } as Profile : undefined,
      // Keep previous data while revalidating
      keepPreviousData: true
    }
  )
  
  // Get display-ready avatar URL with proper fallback chain
  // Priority: 1. Google SSO image from session, 2. Profile avatar_url, 3. Placeholder
  const avatarUrl = session?.user?.image || 
                   profile?.avatar_url || 
                   "/placeholder.svg?height=32&width=32"
  
  // Get display name with fallbacks
  const displayName = profile?.display_name || 
                     session?.user?.name || 
                     "Reader"
  
  // Get initials for fallback
  const initials = displayName
    .split(' ')
    .map((word: string) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  return {
    profile,
    avatarUrl,
    displayName,
    initials,
    email: profile?.email || session?.user?.email,
    isLoading: isLoading && !profile, // Don't show loading if we have fallback data
    error,
    mutate, // For manual updates after profile changes
    isAuthenticated: status === 'authenticated'
  }
}

/**
 * Lightweight hook for just avatar URL - perfect for nav components
 */
export function useAvatarUrl() {
  const { avatarUrl, initials, isLoading } = useProfile()
  
  return {
    avatarUrl,
    initials,
    isLoading
  }
}

/**
 * Hook for updating profile and invalidating cache
 * Use this when user updates their profile picture
 */
export function useProfileMutations() {
  const { mutate } = useProfile()
  
  const updateProfile = async (newData: Partial<Profile>) => {
    // Optimistically update the cache
    await mutate(
      (current: Profile | undefined) => current ? { ...current, ...newData } : undefined,
      false // Don't revalidate immediately
    )
    
    // Then revalidate to sync with server
    await mutate()
  }
  
  const refreshProfile = () => mutate()
  
  return {
    updateProfile,
    refreshProfile
  }
}

/**
 * Hook for getting another user's avatar by their ID
 * Perfect for displaying club members, friends, etc.
 */
export function useUserAvatar(userId: string | null | undefined) {
  const { data: userProfile, error, isLoading } = useSWR<Profile>(
    userId ? `/api/profile/${userId}` : null,
    profileFetcher,
    {
      // Cache for longer since other users' data changes less frequently
      dedupingInterval: 10 * 60 * 1000, // 10 minutes
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryInterval: 60 * 1000, // 1 minute
    }
  )

  const avatarUrl = userProfile?.avatar_url || "/placeholder.svg?height=32&width=32"
  
  const displayName = userProfile?.display_name || userProfile?.nickname || "Reader"
  
  const initials = displayName
    .split(' ')
    .map((word: string) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return {
    avatarUrl,
    displayName,
    initials,
    isLoading,
    error,
    profile: userProfile
  }
}

/**
 * Hook for getting multiple users' avatars at once
 * Perfect for club member lists
 */
export function useMultipleUserAvatars(userIds: string[]) {
  const requests = userIds.map(id => ({
    id,
    ...useUserAvatar(id)
  }))

  return requests
} 