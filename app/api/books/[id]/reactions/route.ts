import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/books/[id]/reactions - Get reaction counts and user's reaction for a book
export async function GET(
  request: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params; 
  try {
    const bookId = id

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    // Get session to check for user's reaction
    const session = await getServerSession(authOptions)
    let currentUser = null

    if (session?.user?.email) {
      currentUser = await prisma.profile.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
    }

    // Get reaction counts
    const reactionCounts = await prisma.reaction.groupBy({
      by: ['type'],
      where: {
        target_type: 'BOOK',
        target_id: bookId
      },
      _count: {
        type: true
      }
    })

    // Get user's current reaction if authenticated
    let userReaction = null
    if (currentUser) {
      userReaction = await prisma.reaction.findFirst({
        where: {
          user_id: currentUser.id,
          target_type: 'BOOK',
          target_id: bookId
        },
        select: { type: true }
      })
    }

    // Format response
    const reactions = {
      HEART: 0,
      THUMBS_UP: 0,
      THUMBS_DOWN: 0,
      LIKE: 0
    }

    reactionCounts.forEach(count => {
      reactions[count.type as keyof typeof reactions] = count._count.type
    })

    return NextResponse.json({
      reactions,
      userReaction: userReaction?.type || null
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching book reactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 