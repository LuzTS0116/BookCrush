import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ActivityType, ActivityTargetEntityType } from '@prisma/client';
import { parseShelfType, parseStatusType } from '@/lib/enum'; // Import your enum parser
import {  shelf_type, status_type  } from '@prisma/client';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookId, shelf } = await request.json();

    if (!bookId || !shelf) {
      return NextResponse.json({ error: 'Book ID and shelf are required' }, { status: 400 });
    }

    // Check if the book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if the book is already on a shelf for this user
    const existingUserBook = await prisma.userBook.findFirst({
      where: {
        user_id: token.id as string,
        book_id: bookId
      }
    });

    if (existingUserBook) {
      // Update existing shelf
      const updatedUserBook = await prisma.userBook.update({
        where: { id: existingUserBook.id },
        data: { shelf }
      });
      return NextResponse.json(updatedUserBook);
    } else {
      // Create new shelf entry
      const newUserBook = await prisma.userBook.create({
        data: {
          user_id: token.id as string,
          book_id: bookId,
          shelf
        }
      });
      return NextResponse.json(newUserBook);
    }

  } catch (error) {
    console.error('Error managing shelf:', error);
    return NextResponse.json({ error: 'Failed to update shelf' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate User
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 2. Get Shelf Query Parameter
    const { searchParams } = new URL(req.url);
    const shelfString = searchParams.get('shelf');

    if (!shelfString) {
      return NextResponse.json({ error: "Shelf query parameter is required (e.g., ?shelf=favorite)" }, { status: 400 });
    }

    let shelfType;
    try {
      shelfType = parseShelfType(shelfString);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // 3. Fetch User Books from Prisma
    const userBooks = await prisma.userBook.findMany({
      where: {
        user_id: user.id,
        shelf: shelfType,
      },
      include: {
        book: {
          include: {
            file: true // Also include file details if you need them
          }
        },
      },
      orderBy: {
        added_at: 'desc', // Or by position, or title, etc.
      },
    });

    return NextResponse.json(userBooks, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching user books:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch books from shelf" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookId } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // Find and delete the user book entry
    const userBook = await prisma.userBook.findFirst({
      where: {
        user_id: token.id as string,
        book_id: bookId
      }
    });

    if (!userBook) {
      return NextResponse.json({ error: 'Book not found in your library' }, { status: 404 });
    }

    await prisma.userBook.delete({
      where: { id: userBook.id }
    });

    return NextResponse.json({ success: true, message: 'Book removed from shelf' });

  } catch (error) {
    console.error('Error removing from shelf:', error);
    return NextResponse.json({ error: 'Failed to remove from shelf' }, { status: 500 });
  }
}