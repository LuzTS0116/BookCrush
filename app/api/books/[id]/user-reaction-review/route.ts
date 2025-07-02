import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/books/[id]/user-reaction-review - Get user's reaction and review for a specific book
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookId = id
    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    // Get userId from query parameters (for viewing other users' profiles)
    const url = new URL(request.url)
    const queryUserId = url.searchParams.get('userId')

    let targetUserId: string

    if (queryUserId) {
      // If userId is provided, get that specific user's reaction/review
      targetUserId = queryUserId
    } else {
      // Default to current user (backward compatibility)
      const currentUser = await prisma.profile.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      targetUserId = currentUser.id
    }

    // Get user's reaction and review in parallel
    const [userReaction, userReview] = await Promise.all([
      prisma.reaction.findFirst({
        where: {
          user_id: targetUserId,
          target_type: 'BOOK',
          target_id: bookId
        },
        select: { type: true, created_at: true }
      }),
      prisma.bookReview.findUnique({
        where: {
          user_id_book_id: {
            user_id: targetUserId,
            book_id: bookId
          }
        },
        select: {
          content: true,
          rating: true,
          created_at: true,
          updated_at: true
        }
      })
    ])

    return NextResponse.json({
      reaction: userReaction ? {
        type: userReaction.type,
        created_at: userReaction.created_at
      } : null,
      review: userReview ? {
        content: userReview.content,
        rating: userReview.rating,
        created_at: userReview.created_at,
        updated_at: userReview.updated_at
      } : null
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching user reaction and review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 