import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    // Get the authenticated user
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookId, comment } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // Validate comment length (60 characters max)
    if (comment && comment.length > 60) {
      return NextResponse.json({ error: 'Comment must be 60 characters or less' }, { status: 400 });
    }

    // Find the user's book entry
    const userBook = await prisma.userBook.findFirst({
      where: {
        user_id: token.id as string,
        book_id: bookId,
      }
    });

    if (!userBook) {
      return NextResponse.json({ error: 'Book not found in your library' }, { status: 404 });
    }

    // Update the comment using the compound unique key
    const updatedUserBook = await prisma.userBook.update({
      where: {
        user_id_book_id_shelf: {
          user_id: token.id as string,
          book_id: bookId,
          shelf: userBook.shelf
        }
      },
      data: {
        comment: comment || null
      }
    });

    return NextResponse.json({ 
      success: true, 
      comment: updatedUserBook.comment 
    });

  } catch (error) {
    console.error('Error updating book comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
} 