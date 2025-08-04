import { useState, useCallback } from 'react'

interface Friend {
  id: string
  name: string
}

interface ExtendedSession {
  user?: {
    id?: string
    email?: string
    name?: string
    image?: string
  }
  supabaseAccessToken?: string
  expires: string
}

interface UseFriendsProps {
  session: ExtendedSession | null
  status: string
}

export function useFriends({ session, status }: UseFriendsProps) {
  const [friendsList, setFriendsList] = useState<Friend[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)

  const fetchFriends = useCallback(async () => {
    if (status !== 'authenticated') {
      console.log('[useFriends] Not authenticated, skipping friends fetch')
      return
    }

    if (!session?.supabaseAccessToken) {
      console.log('[useFriends] No access token, skipping friends fetch')
      return
    }

    console.log('[useFriends] Fetching friends for user:', session?.user?.id)
    setIsLoadingFriends(true)
    
    try {
      const response = await fetch('/api/friends?type=friends', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
      })
      
      if (response.ok) {
        const friendshipsData = await response.json()
        console.log('[useFriends] Friendships data:', friendshipsData)
        
        // Extract friends from friendship relationships
        const formattedFriends = friendshipsData.map((friendship: any) => {
          // Determine which user is the friend (not the current user)
          const friend = friendship.user_one?.id === session?.user?.id 
            ? friendship.user_two 
            : friendship.user_one
          
          return {
            id: friend?.id || '',
            name: friend?.display_name || 'Unknown'
          }
        }).filter((friend: any) => friend.id) // Filter out any invalid entries
        
        console.log('[useFriends] Formatted friends:', formattedFriends)
        setFriendsList(formattedFriends)
      } else {
        const errorData = await response.text()
        console.error('[useFriends] Failed to fetch friends:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setIsLoadingFriends(false)
    }
  }, [session, status])

  return {
    friendsList,
    isLoadingFriends,
    fetchFriends,
  }
} 