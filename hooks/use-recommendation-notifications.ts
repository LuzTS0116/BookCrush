import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface RecommendationStats {
  unreadCount: number
  totalReceived: number
  totalSent: number
  hasUnread: boolean
}

interface PushNotificationState {
  isSupported: boolean
  isSubscribed: boolean
  isSubscribing: boolean
  subscription: PushSubscription | null
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
  const [pushState, setPushState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isSubscribing: false,
    subscription: null
  })

  // Check if push notifications are supported
  useEffect(() => {
    const checkPushSupport = () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
      const isDev = process.env.NODE_ENV === 'development'
      
      // In development, we might not have a service worker registered
      if (isDev) {
        console.log('Development mode detected - push notifications may be limited')
      }
      
      setPushState(prev => ({ ...prev, isSupported }))
    }
    
    checkPushSupport()
  }, [])

  // Check existing subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!pushState.isSupported || !session?.supabaseAccessToken) return

      try {
        console.log('Checking for existing service worker registration...');
        const registration = await navigator.serviceWorker.ready
        console.log('Service worker ready:', registration);
        
        const subscription = await registration.pushManager.getSubscription()
        console.log('Existing subscription:', subscription);
        
        setPushState(prev => ({
          ...prev,
          isSubscribed: !!subscription,
          subscription
        }))
      } catch (error) {
        console.error('Error checking push subscription:', error)
        // On Vercel, sometimes the service worker might not be ready immediately
        if (error instanceof Error && error.message.includes('No service worker')) {
          console.log('Service worker not ready yet, will retry...');
        }
      }
    }

    checkSubscription()
  }, [pushState.isSupported, session?.supabaseAccessToken])

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

  // Subscribe to push notifications
  const subscribeToPushNotifications = async () => {
    if (!pushState.isSupported || !session?.supabaseAccessToken) {
      throw new Error('Push notifications not supported or user not authenticated')
    }

    // Check if VAPID key is available
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      throw new Error('VAPID public key not configured')
    }

    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      console.warn('Push notifications in development mode may not work properly')
    }

    setPushState(prev => ({ ...prev, isSubscribing: true }))

    try {
      console.log('Starting push notification subscription...')
      const registration = await navigator.serviceWorker.ready
      console.log('Service worker ready:', registration)
      
      // Request notification permission
      const permission = await Notification.requestPermission()
      console.log('Notification permission:', permission)
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })
      console.log('Push subscription created:', subscription)
      console.log('VAPID public key:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          type: 'recommendation'
        })
      })

      console.log('Server response:', response.status, response.statusText)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        throw new Error('Failed to register subscription with server')
      }

      const result = await response.json()
      console.log('Server result:', result)

      setPushState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        isSubscribing: false
      }))

      return subscription
    } catch (error) {
      console.error('Error in subscribeToPushNotifications:', error)
      setPushState(prev => ({ ...prev, isSubscribing: false }))
      throw error
    }
  }

  // Unsubscribe from push notifications
  const unsubscribeFromPushNotifications = async () => {
    if (!pushState.subscription) return

    try {
      await pushState.subscription.unsubscribe()
      
      // Notify server about unsubscription
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription: pushState.subscription.toJSON(),
          type: 'recommendation'
        })
      })

      setPushState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null
      }))
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
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
    markAsRead,
    // Push notification methods
    pushNotifications: {
      isSupported: pushState.isSupported,
      isSubscribed: pushState.isSubscribed,
      isSubscribing: pushState.isSubscribing,
      subscribe: subscribeToPushNotifications,
      unsubscribe: unsubscribeFromPushNotifications
    }
  }
} 