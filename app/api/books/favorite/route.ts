import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/prisma';

/**
 * Favorite API - Clean Logic:
 * - If book doesn't exist in any shelf: Create entry with shelf = 'favorite' 
 * - If book exists in shelf(s): Just toggle is_favorite boolean
 * - Unfavoriting with shelf = 'favorite': Delete entire row (no reading progress)
 * - Unfavoriting with other shelves: Just set is_favorite = false (preserve data)
 */

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
    const { bookId } = body;

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
      // Book doesn't exist in any shelf - create new entry with shelf = 'favorite'
      const newUserBook = await prisma.userBook.create({
        data: {
          user_id: user.id,
          book_id: bookId,
          shelf: 'favorite', // Use 'favorite' shelf for favorites-only books
          is_favorite: true,
        },
      });

      return NextResponse.json({
        success: true,
        is_favorite: true,
        message: 'Book added to favorites',
        created_new_entry: true
      });
    }

    // Book exists in one or more shelves
    const currentFavoriteStatus = userBooks[0].is_favorite;
    const newFavoriteStatus = !currentFavoriteStatus;

    if (newFavoriteStatus === false) {
      // Unfavoriting
      const favoriteShelfEntries = userBooks.filter(userBook => userBook.shelf === 'favorite');
      const otherShelfEntries = userBooks.filter(userBook => userBook.shelf !== 'favorite');

      // Delete entries that are in 'favorite' shelf (they exist only for favoriting)
      if (favoriteShelfEntries.length > 0) {
        await Promise.all(
          favoriteShelfEntries.map(userBook =>
            prisma.userBook.delete({
              where: {
                user_id_book_id_shelf: {
                  user_id: user.id,
                  book_id: bookId,
                  shelf: 'favorite'
                }
              }
            })
          )
        );
      }

      // Update other shelf entries to unfavorite (preserve reading progress)
      if (otherShelfEntries.length > 0) {
        await Promise.all(
          otherShelfEntries.map(userBook =>
            prisma.userBook.update({
              where: {
                user_id_book_id_shelf: {
                  user_id: user.id,
                  book_id: bookId,
                  shelf: userBook.shelf
                }
              },
              data: {
                is_favorite: false,
              },
            })
          )
        );
      }

      return NextResponse.json({
        success: true,
        is_favorite: false,
        message: 'Book removed from favorites',
        deleted_favorite_entries: favoriteShelfEntries.length,
        updated_other_entries: otherShelfEntries.length
      });
    } else {
      // Favoriting: Update is_favorite on all existing entries
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
              is_favorite: true,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        is_favorite: true,
        message: 'Book added to favorites',
        updated_entries: updates.length
      });
    }

  } catch (err: any) {
    console.error("Error toggling favorite status:", err);
    return NextResponse.json(
      { error: err.message || "Failed to toggle favorite status" },
      { status: 500 }
    );
  }
} 