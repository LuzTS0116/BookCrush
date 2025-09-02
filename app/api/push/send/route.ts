import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from auth using cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { recipientId, bookTitle, senderName } = await request.json()

    if (!recipientId || !bookTitle || !senderName) {
      return NextResponse.json({ 
        error: 'Recipient ID, book title, and sender name are required' 
      }, { status: 400 })
    }

    // Get the recipient's push subscriptions for recommendations
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: recipientId,
        type: 'recommendation'
      }
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No push subscriptions found for recipient' 
      })
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

    return NextResponse.json({ 
      success: true, 
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    })

  } catch (error) {
    console.error('Error sending push notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
