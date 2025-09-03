import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from auth using cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { subscription, type } = await request.json()

    if (!subscription || !type) {
      return NextResponse.json({ error: 'Subscription and type are required' }, { status: 400 })
    }

    // Remove the subscription from the database
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: user.id,
        type: type,
        endpoint: subscription.endpoint
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully unsubscribed' 
    })

  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
