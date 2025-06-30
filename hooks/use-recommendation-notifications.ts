import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface RecommendationStats {
  unreadCount: number
  totalReceived: number
  totalSent: number
  hasUnread: boolean
}

export function useRecommendationNotifications() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<RecommendationStats>({
    unreadCount: 0,
    totalReceived: 0,
    totalSent: 0,
    hasUnread: false
  })
  const [isLoading, setIsLoading] = useState(false)

  const fetchStats = async () => {
    if (!session?.supabaseAccessToken) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/recommendations/stats', {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats({
          unreadCount: data.unreadCount || 0,
          totalReceived: data.totalReceived || 0,
          totalSent: data.totalSent || 0,
          hasUnread: data.hasUnread || false
        })
      }
    } catch (error) {
      console.error('Error fetching recommendation stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch stats when session is available
  useEffect(() => {
    if (session?.supabaseAccessToken) {
      fetchStats()
    }
  }, [session?.supabaseAccessToken])

  // Function to manually refresh stats (useful after actions)
  const refreshStats = () => {
    fetchStats()
  }

  // Function to mark recommendations as read (decrease unread count)
  const markAsRead = (count: number = 1) => {
    setStats(prev => ({
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - count),
      hasUnread: Math.max(0, prev.unreadCount - count) > 0
    }))
  }

  return {
    unreadCount: stats.unreadCount,
    totalReceived: stats.totalReceived,
    totalSent: stats.totalSent,
    hasUnread: stats.hasUnread,
    isLoading,
    refreshStats,
    markAsRead
  }
} 