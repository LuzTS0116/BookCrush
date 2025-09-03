'use client'

import { useState, useEffect } from 'react'
import { useRecommendationNotifications } from '@/hooks/use-recommendation-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, BellOff, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function NotificationSettings() {
  const { pushNotifications } = useRecommendationNotifications()
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsEnabled(pushNotifications.isSubscribed)
  }, [pushNotifications.isSubscribed])

  const handleToggleNotifications = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      if (isEnabled) {
        await pushNotifications.unsubscribe()
        toast.success('Push notifications disabled')
      } else {
        await pushNotifications.subscribe()
        toast.success('Push notifications enabled! You\'ll receive notifications for new book recommendations.')
      }
    } catch (error) {
      console.error('Error toggling notifications:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update notification settings'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!pushNotifications.isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Your browser doesn't support push notifications
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when friends recommend books to you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications" className="text-base">
              Book Recommendations
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications when friends recommend books to you
            </p>
          </div>
          <Switch
            id="notifications"
            checked={isEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading || pushNotifications.isSubscribing}
          />
        </div>

        {isEnabled && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Push notifications are enabled
          </div>
        )}

        {pushNotifications.isSubscribing && (
          <div className="text-sm text-muted-foreground">
            Setting up notifications...
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          You can change these settings at any time. Notifications will only be sent when the app is closed or in the background.
        </div>
      </CardContent>
    </Card>
  )
}
