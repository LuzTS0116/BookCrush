import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '../../../../../lib/auth-utils';
import { prisma } from '@/lib/prisma';



export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication and role
    await requireAdmin();

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            display_name: true,
          },
        },
        _count: {
          select: {
            UserBook: true,
            reviews: true,
            club_meetings: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching book:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to fetch book' }, { status: 500 });
  } finally {
    
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication and role
    await requireAdmin();

    const body = await req.json();
    const { 
      title, 
      author, 
      cover_url, 
      description, 
      reading_time, 
      pages, 
      genres, 
      published_date, 
      rating 
    } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const updatedBook = await prisma.book.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        cover_url: cover_url?.trim() || null,
        description: description?.trim() || null,
        reading_time: reading_time?.trim() || null,
        pages: pages || null,
        genres: genres || [],
        published_date: published_date?.trim() || null,
        rating: rating || null,
      },
      include: {
        creator: {
          select: {
            display_name: true,
          },
        },
        _count: {
          select: {
            UserBook: true,
            reviews: true,
            club_meetings: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBook, { status: 200 });

  } catch (error: any) {
    console.error('Error updating book:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ error: error.message || 'Failed to update book' }, { status: 500 });
  } finally {
    
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication and role
    await requireAdmin();

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            UserBook: true,
            reviews: true,
            club_meetings: true,
            ClubDiscussion: true,
          },
        },
      },
    });

    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if book has dependencies that would prevent deletion
    const hasUserBooks = existingBook._count.UserBook > 0;
    const hasReviews = existingBook._count.reviews > 0;
    const hasMeetings = existingBook._count.club_meetings > 0;
    const hasDiscussions = existingBook._count.ClubDiscussion > 0;

    if (hasUserBooks || hasReviews || hasMeetings || hasDiscussions) {
      return NextResponse.json({ 
        error: 'Cannot delete book: it has associated user data (shelved books, reviews, meetings, or discussions). Consider archiving instead.' 
      }, { status: 400 });
    }

    // Delete book (this will cascade delete related records due to schema constraints)
    await prisma.book.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Book deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting book:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete book: it has associated data. Remove all references first.' 
      }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Failed to delete book' }, { status: 500 });
  } finally {
    
  }
} 