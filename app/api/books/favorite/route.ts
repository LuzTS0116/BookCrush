import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { bookId, shelf } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    // Find if the book exists in any of the user's shelves
    const userBooks = await prisma.userBook.findMany({
      where: {
        user_id: user.id,
        book_id: bookId,
      },
    });

    if (userBooks.length === 0) {
      // Book is not in any shelf, create a new entry in the "favorite" shelf
      const newUserBook = await prisma.userBook.create({
        data: {
          user_id: user.id,
          book_id: bookId,
          shelf: 'favorite', // Use the favorite shelf type
          is_favorite: true, // Also set the boolean flag
          // status is optional, so we don't need to set it
        },
      });

      return NextResponse.json({
        success: true,
        is_favorite: true,
        shelf: 'favorite',
        message: 'Book added to favorites'
      });
    }

    // If we're targeting a specific shelf
    if (shelf) {
      const userBook = userBooks.find(book => book.shelf === shelf);
      
      if (!userBook) {
        return NextResponse.json(
          { error: `Book not found in ${shelf} shelf` },
          { status: 404 }
        );
      }

      // Toggle the is_favorite status for the specified shelf
      const updatedUserBook = await prisma.userBook.update({
        where: {
          user_id_book_id_shelf: {
            user_id: user.id,
            book_id: bookId,
            shelf: shelf
          },
        },
        data: {
          is_favorite: !userBook.is_favorite,
        },
      });

      return NextResponse.json({
        success: true,
        is_favorite: updatedUserBook.is_favorite,
        shelf
      });
    } 
    else {
      // No specific shelf provided, toggle favorite status on all shelves
      const updates = await Promise.all(
        userBooks.map(userBook => 
          prisma.userBook.update({
            where: {
              user_id_book_id_shelf: {
                user_id: user.id,
                book_id: bookId,
                shelf: userBook.shelf
              },
            },
            data: {
              is_favorite: !userBooks[0].is_favorite, // Toggle based on first book's status
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        is_favorite: updates[0].is_favorite,
        updatedShelves: updates.map(book => book.shelf)
      });
    }

  } catch (err: any) {
    console.error("Error toggling favorite status:", err);
    return NextResponse.json(
      { error: err.message || "Failed to toggle favorite status" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 