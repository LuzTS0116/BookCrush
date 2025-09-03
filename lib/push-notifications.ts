import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(
  recipientId: string,
  bookTitle: string,
  senderName: string
) {
  try {
    console.log('=== PUSH NOTIFICATION DEBUG ===')
    console.log('Sending push notification to user:', recipientId)
    console.log('Book title:', bookTitle)
    console.log('Sender name:', senderName)
    
    // Check VAPID configuration
    console.log('VAPID Email:', process.env.VAPID_EMAIL)
    console.log('VAPID Public Key exists:', !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    console.log('VAPID Private Key exists:', !!process.env.VAPID_PRIVATE_KEY)
    
    // Get the recipient's push subscriptions for recommendations
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: recipientId,
        type: 'recommendation'
      }
    })

    console.log('Found subscriptions:', subscriptions.length)
    subscriptions.forEach((sub, index) => {
      console.log(`Subscription ${index}:`, {
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        hasKeys: !!(sub.p256dh && sub.auth)
      })
    })

    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for recipient:', recipientId)
      return {
        success: true,
        message: 'No push subscriptions found for recipient'
      }
    }

    // Prepare the notification payload
    const notificationPayload = {
      title: 'New Book Recommendation! 📚',
      body: `${senderName} recommended "${bookTitle}" to you`,
      icon: '/icons/icon-192x192.png',
      badge: '', // Remove badge (right-side icon)
      data: {
        url: '/profile?openRecommendations=true', // URL to navigate to when notification is clicked
        type: 'recommendation',
        bookTitle,
        senderName
      },
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }

    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload)
          )

          return { success: true, subscriptionId: subscription.id }
        } catch (error) {
          console.error('Error sending push notification:', error)
          
          // If subscription is invalid, remove it
          const pushError = error as any
          if (pushError.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: { id: subscription.id }
            })
          }
          
          return { success: false, subscriptionId: subscription.id, error }
        }
      })
    )

    const successful = results.filter(
      (result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value.success
    ).length

    const failed = results.length - successful

    console.log(`Push notifications sent: ${successful} successful, ${failed} failed`)

    return {
      success: true,
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    }

  } catch (error) {
    console.error('Error sending push notifications:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}
