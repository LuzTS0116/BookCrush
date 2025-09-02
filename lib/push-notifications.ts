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
    console.log('Sending push notification to user:', recipientId)
    
    // Get the recipient's push subscriptions for recommendations
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: recipientId,
        type: 'recommendation'
      }
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
      badge: '/icons/icon-192x192.png',
      data: {
        url: '/books', // URL to navigate to when notification is clicked
        type: 'recommendation',
        bookTitle,
        senderName
      },
      actions: [
        {
          action: 'view',
          title: 'View Recommendation'
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
          if (error.statusCode === 410) {
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
