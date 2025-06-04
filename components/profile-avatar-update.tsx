import { useProfileMutations } from '@/hooks/use-profile'
import { toast } from 'sonner'

/**
 * Example utility for updating profile avatar and refreshing cache
 * Use this pattern in profile editing components
 */
export function useAvatarUpdate() {
  const { updateProfile, refreshProfile } = useProfileMutations()
  
  const updateAvatar = async (newAvatarUrl: string) => {
    try {
      // Optimistically update the cache immediately
      await updateProfile({ avatar_url: newAvatarUrl })
      
      toast.success('Profile picture updated!')
      
      // The cache will automatically sync with the server
      // and update all components using useProfile()
      
    } catch (error) {
      toast.error('Failed to update profile picture')
      // Refresh to get the correct state from server
      refreshProfile()
    }
  }
  
  const refreshAvatar = () => {
    refreshProfile()
  }
  
  return {
    updateAvatar,
    refreshAvatar
  }
}

/**
 * Example component showing how to trigger avatar updates
 * This will automatically update the navigation component
 */
export function AvatarUpdateExample() {
  const { updateAvatar } = useAvatarUpdate()
  
  const handleAvatarChange = async (file: File) => {
    // Your existing upload logic here...
    // After successful upload, update the cache:
    
    const newAvatarUrl = 'new-avatar-url-from-upload'
    await updateAvatar(newAvatarUrl)
    
    // The navigation component will automatically show the new avatar!
  }
  
  return (
    <div>
      {/* Your avatar upload UI */}
    </div>
  )
} 