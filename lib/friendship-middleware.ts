import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { areUsersFriends } from './friendship-utils'

export interface AuthenticatedUser {
  id: string
  email?: string
}

/**
 * Authenticate the user and return user data
 */
export async function authenticateUser(): Promise<{ user: AuthenticatedUser | null, error: NextResponse | null }> {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Not authenticated', details: 'No active user session.' },
          { status: 401 }
        )
      }
    }

    return { user: { id: user.id, email: user.email }, error: null }
  } catch (error) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed', details: 'Failed to verify user session.' },
        { status: 401 }
      )
    }
  }
}

/**
 * Middleware to require friendship between authenticated user and target user
 */
export async function requireFriendship(
  authenticatedUserId: string,
  targetUserId: string,
  prisma: PrismaClient
): Promise<{ allowed: boolean, error: NextResponse | null }> {
  try {
    const isFriend = await areUsersFriends(prisma, authenticatedUserId, targetUserId)
    
    if (!isFriend) {
      return {
        allowed: false,
        error: NextResponse.json(
          { error: 'Access denied', details: 'You can only access content from users who are your friends.' },
          { status: 403 }
        )
      }
    }

    return { allowed: true, error: null }
  } catch (error) {
    console.error('Error checking friendship requirement:', error)
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'Access validation failed', details: 'Could not verify friendship status.' },
        { status: 500 }
      )
    }
  }
}

/**
 * Combined authentication and friendship validation
 */
export async function requireAuthAndFriendship(
  targetUserId: string,
  prisma: PrismaClient
): Promise<{
  user: AuthenticatedUser | null
  allowed: boolean
  error: NextResponse | null
}> {
  // First authenticate the user
  const { user, error: authError } = await authenticateUser()
  
  if (authError || !user) {
    return { user: null, allowed: false, error: authError }
  }

  // Allow users to access their own content
  if (user.id === targetUserId) {
    return { user, allowed: true, error: null }
  }

  // Check friendship requirement
  const { allowed, error: friendshipError } = await requireFriendship(user.id, targetUserId, prisma)
  
  return { user, allowed, error: friendshipError }
}

/**
 * Rate limiting for friend-related actions (optional security measure)
 */
const friendshipActionCounts = new Map<string, { count: number, resetTime: number }>()

export function rateLimitFriendshipActions(userId: string, maxActions = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const userActions = friendshipActionCounts.get(userId)

  if (!userActions || now > userActions.resetTime) {
    friendshipActionCounts.set(userId, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userActions.count >= maxActions) {
    return false
  }

  userActions.count++
  return true
} 