import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '../../../../../lib/auth-utils';
import { prisma } from '@/lib/prisma';



export async function GET(
  req: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
  try {
    // Check admin authentication and role
    await requireAdmin();

    const book = await prisma.book.findUnique({
      where: { id: id },
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
  req: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
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
      where: { id: id },
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
  req: Request,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
  try {
    // Check admin authentication and role
    await requireAdmin();

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            UserBook: true,
            reviews: true,
            club_meetings: true,
            ClubDiscussion: true,
            file: true,
            current_in_clubs: true,
            club_history: true,
            book_reactions: true,
            recommendations: true,
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
    const hasFiles = existingBook._count.file > 0;
    const isCurrentInClubs = existingBook._count.current_in_clubs > 0;
    const hasClubHistory = existingBook._count.club_history > 0;
    const hasReactions = existingBook._count.book_reactions > 0;
    const hasRecommendations = existingBook._count.recommendations > 0;

    console.log('Book deletion check for:', id, {
      userBooks: existingBook._count.UserBook,
      reviews: existingBook._count.reviews,
      meetings: existingBook._count.club_meetings,
      discussions: existingBook._count.ClubDiscussion,
      files: existingBook._count.file,
      currentInClubs: existingBook._count.current_in_clubs,
      clubHistory: existingBook._count.club_history,
      reactions: existingBook._count.book_reactions,
      recommendations: existingBook._count.recommendations
    });

    if (hasUserBooks || hasReviews || hasMeetings || hasDiscussions || hasFiles || 
        isCurrentInClubs || hasClubHistory || hasReactions || hasRecommendations) {
      const reasons = [];
      if (hasUserBooks) reasons.push(`${existingBook._count.UserBook} user books`);
      if (hasReviews) reasons.push(`${existingBook._count.reviews} reviews`);
      if (hasMeetings) reasons.push(`${existingBook._count.club_meetings} meetings`);
      if (hasDiscussions) reasons.push(`${existingBook._count.ClubDiscussion} discussions`);
      if (hasFiles) reasons.push(`${existingBook._count.file} files`);
      if (isCurrentInClubs) reasons.push(`current book in ${existingBook._count.current_in_clubs} clubs`);
      if (hasClubHistory) reasons.push(`${existingBook._count.club_history} club history records`);
      if (hasReactions) reasons.push(`${existingBook._count.book_reactions} reactions`);
      if (hasRecommendations) reasons.push(`${existingBook._count.recommendations} recommendations`);
      
      const errorMessage = `Cannot delete book: it has associated data (${reasons.join(', ')}). Consider archiving instead.`;
      
      console.error('Book deletion prevented:', {
        bookId: id,
        errorMessage,
        reasons,
        counts: {
          userBooks: existingBook._count.UserBook,
          reviews: existingBook._count.reviews,
          meetings: existingBook._count.club_meetings,
          discussions: existingBook._count.ClubDiscussion,
          files: existingBook._count.file,
          currentInClubs: existingBook._count.current_in_clubs,
          clubHistory: existingBook._count.club_history,
          reactions: existingBook._count.book_reactions,
          recommendations: existingBook._count.recommendations
        }
      });
      
      return NextResponse.json({ 
        error: errorMessage,
        message: errorMessage, // Some frontends look for 'message' instead of 'error'
        details: {
          userBooks: existingBook._count.UserBook,
          reviews: existingBook._count.reviews,
          meetings: existingBook._count.club_meetings,
          discussions: existingBook._count.ClubDiscussion,
          files: existingBook._count.file,
          currentInClubs: existingBook._count.current_in_clubs,
          clubHistory: existingBook._count.club_history,
          reactions: existingBook._count.book_reactions,
          recommendations: existingBook._count.recommendations
        },
        reasons: reasons
      }, { status: 400 });
    }

    // Delete book (this will cascade delete related records due to schema constraints)
    console.log('Proceeding with book deletion for:', id);
    await prisma.book.delete({
      where: { id: id }
    });

    console.log('Book deleted successfully:', id);
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