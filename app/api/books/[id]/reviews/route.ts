import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client', ReactionType 

const prisma = new PrismaClient()

// GET /api/books/[id]/reviews - Fetch reviews for a book
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

    // Fetch reviews for the book
    const reviews = await prisma.bookReview.findMany({
      where: {
        book_id: bookId
      },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            nickname: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform the data to match the expected format
    const formattedReviews = reviews.map((review: any) => ({
      id: review.id,
      user: {
        id: review.user.id,
        name: review.user.display_name,
        avatar: review.user.avatar_url,
        initials: review.user.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      },
      rating: review.rating,
      text: review.content,
      date: review.created_at.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }))

    return NextResponse.json(formattedReviews, { status: 200 })

  } catch (error) {
    console.error('Error fetching book reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/books/[id]/reviews - Create or update a review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const bookId = params.id
    const { content, rating } = await request.json()

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    if (!content || !rating) {
      return NextResponse.json({ error: 'Content and rating are required' }, { status: 400 })
    }

    // Validate rating is a valid ReactionType
    if (!Object.values(ReactionType).includes(rating as ReactionType)) {
      return NextResponse.json({ error: 'Invalid rating type' }, { status: 400 })
    }

    // Verify book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Use transaction to create/update review and handle reaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or update the review
      const review = await tx.bookReview.upsert({
        where: {
          user_id_book_id: {
            user_id: userId,
            book_id: bookId
          }
        },
        update: {
          content,
          rating: rating as ReactionType,
          updated_at: new Date()
        },
        create: {
          user_id: userId,
          book_id: bookId,
          content,
          rating: rating as ReactionType
        },
        include: {
          user: {
            select: {
              id: true,
              display_name: true,
              nickname: true,
              avatar_url: true
            }
          }
        }
      })

      // Also create/update the reaction in the reactions table for consistency
      await tx.reaction.upsert({
        where: {
          user_id_target_type_target_id_type: {
            user_id: userId,
            target_type: 'BOOK',
            target_id: bookId,
            type: rating as ReactionType
          }
        },
        update: {
          created_at: new Date()
        },
        create: {
          user_id: userId,
          target_type: 'BOOK',
          target_id: bookId,
          type: rating as ReactionType
        }
      })

      return review
    })

    // Format the response
    const formattedReview = {
      id: result.id,
      user: {
        id: result.user.id,
        name: result.user.display_name,
        avatar: result.user.avatar_url,
        initials: result.user.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      },
      rating: result.rating,
      text: result.content,
      date: result.created_at.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }

    return NextResponse.json({ 
      message: 'Review created successfully',
      review: formattedReview
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating book review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 