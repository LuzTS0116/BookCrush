import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma';
import { ReactionType } from '@prisma/client' 
import {getAvatarPublicUrlServer} from '@/lib/supabase-server-utils';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for book reviews API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;


// GET /api/books/[id]/reviews - Fetch reviews for a book
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  const {id} = await params; 
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

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
    const formattedReviews = await Promise.all(reviews.map(async (review: any) => ({
      
      id: review.id,
      user: {
        id: review.user.id,
        name: review.user.display_name,
        avatar: await getAvatarPublicUrlServer(supabase!, review.user.avatar_url),
        initials: review.user.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      },
      rating: review.rating,
      text: review.content,
      date: review.created_at.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      updated_at: review.updated_at ? review.updated_at.toISOString() : null
    })))

    return NextResponse.json(formattedReviews, { status: 200 })

  } catch (error) {
    console.error('Error fetching book reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    
  }
}

// POST /api/books/[id]/reviews - Create or update a review
export async function POST(
   request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  const {id} = await params; 
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const bookId = id
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

      // Create activity log for book review
      await tx.activityLog.create({
        data: {
          user_id: userId,
          activity_type: 'REVIEWED_BOOK',
          target_entity_type: 'BOOK',
          target_entity_id: bookId,
          details: {
            book_title: book.title,
            book_cover_url: book.cover_url,
            rating: rating,
            review_content: content.substring(0, 100) + (content.length > 100 ? '...' : '') // Store first 100 chars
          }
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
        avatar: await getAvatarPublicUrlServer(supabase!, result.user.avatar_url),
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
    
  }
}

// PUT /api/books/[id]/reviews - Update a specific review
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const bookId = id;
    const { reviewId, content, rating } = await request.json();

    if (!reviewId || !content || !rating) {
      return NextResponse.json({ error: 'Review ID, content and rating are required' }, { status: 400 });
    }

    // Validate rating is a valid ReactionType
    if (!Object.values(ReactionType).includes(rating as ReactionType)) {
      return NextResponse.json({ error: 'Invalid rating type' }, { status: 400 });
    }

    // Check if the review exists and belongs to the user
    const existingReview = await prisma.bookReview.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true
          }
        }
      }
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (existingReview.user_id !== userId) {
      return NextResponse.json({ error: 'You can only edit your own reviews' }, { status: 403 });
    }

    // Update the review
    const updatedReview = await prisma.$transaction(async (tx) => {
      const review = await tx.bookReview.update({
        where: { id: reviewId },
        data: {
          content,
          rating: rating as ReactionType,
          updated_at: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              display_name: true,
              avatar_url: true
            }
          }
        }
      });

      // Update the corresponding reaction
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
      });

      return review;
    });

    // Format the response
    const formattedReview = {
      id: updatedReview.id,
      text: updatedReview.content,
      rating: updatedReview.rating,
      updated_at: updatedReview.updated_at?.toISOString()
    };

    return NextResponse.json({ 
      message: 'Review updated successfully',
      review: formattedReview
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating book review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/books/[id]/reviews - Delete a specific review
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const bookId = id;
    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    // Check if the review exists and belongs to the user
    const existingReview = await prisma.bookReview.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (existingReview.user_id !== userId) {
      return NextResponse.json({ error: 'You can only delete your own reviews' }, { status: 403 });
    }

    // Delete the review and corresponding reaction
    await prisma.$transaction(async (tx) => {
      await tx.bookReview.delete({
        where: { id: reviewId }
      });

      // Delete the corresponding reaction
      await tx.reaction.deleteMany({
        where: {
          user_id: userId,
          target_type: 'BOOK',
          target_id: bookId,
          type: existingReview.rating
        }
      });
    });

    return NextResponse.json({ 
      message: 'Review deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting book review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}