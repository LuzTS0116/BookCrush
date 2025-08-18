import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { updates, shelf } = await request.json();

    // Validate input
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Updates array is required' }, { status: 400 });
    }

    if (!shelf) {
      return NextResponse.json({ error: 'Shelf is required' }, { status: 400 });
    }

    // Validate shelf type
    const validShelves = ['favorite', 'currently_reading', 'queue', 'history'];
    if (!validShelves.includes(shelf)) {
      return NextResponse.json({ error: 'Invalid shelf type' }, { status: 400 });
    }

    // Validate each update object
    for (const update of updates) {
      if (!update.bookId || typeof update.position !== 'number') {
        return NextResponse.json({ 
          error: 'Each update must have bookId and position' 
        }, { status: 400 });
      }
    }

    // Use a transaction to update all positions atomically
    const result = await prisma.$transaction(async (tx) => {
      const updatePromises = updates.map((update: { bookId: string; position: number }) =>
        tx.userBook.updateMany({
          where: {
            user_id: token.id as string,
            book_id: update.bookId,
            shelf: shelf as any, // Cast to avoid TypeScript enum issues
          },
          data: {
            position: update.position,
          },
        })
      );

      await Promise.all(updatePromises);

      // Return the updated books in the new order
      const updatedBooks = await tx.userBook.findMany({
        where: {
          user_id: token.id as string,
          shelf: shelf as any,
        },
        include: {
          book: {
            include: {
              creator: {
                select: {
                  id: true,
                  display_name: true,
                  
                  avatar_url: true,
                },
              },
            },
          },
        },
        orderBy: {
          position: 'asc',
        },
      });

      return updatedBooks;
    });

    return NextResponse.json({
      success: true,
      message: 'Book order updated successfully',
      books: result,
    });

  } catch (error) {
    console.error('Error reordering books:', error);
    return NextResponse.json({ 
      error: 'Failed to reorder books' 
    }, { status: 500 });
  }
} 