import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Push subscribe endpoint called')
    const supabase = await createClient()
    
    // Get user from auth using cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth result:', { user: user?.id, error: authError })
    
    if (authError || !user) {
      console.error('Auth failed:', authError)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { subscription, type } = await request.json()
    console.log('Request body:', { type, subscription: subscription ? 'present' : 'missing' })

    if (!subscription || !type) {
      return NextResponse.json({ error: 'Subscription and type are required' }, { status: 400 })
    }

    console.log('Storing subscription for user:', user.id)
    // Store the subscription in the database
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: type
        }
      },
      update: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        type: type,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    })

    console.log('Subscription stored successfully:', pushSubscription.id)
    return NextResponse.json({ 
      success: true, 
      subscription: pushSubscription 
    })

  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
