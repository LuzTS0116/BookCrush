import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/books/[id]/user-reaction-review - Get current user's reaction and review for a specific book
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

    // Get current user
    const currentUser = await prisma.profile.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's reaction and review in parallel
    const [userReaction, userReview] = await Promise.all([
      prisma.reaction.findFirst({
        where: {
          user_id: currentUser.id,
          target_type: 'BOOK',
          target_id: bookId
        },
        select: { type: true, created_at: true }
      }),
      prisma.bookReview.findUnique({
        where: {
          user_id_book_id: {
            user_id: currentUser.id,
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