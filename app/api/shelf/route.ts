import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma';
import { parseShelfType, parseStatusType } from '@/lib/enum'; // Import your enum parser
import { shelf_type, status_type } from '@/lib/generated/prisma';

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
    
  try {
    // 1. Authenticate User
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { bookId, shelf: shelfString, status: statusString, position } = await req.json();

    // 2. Validate Input
    if (!bookId || !shelfString) {
      return NextResponse.json({ error: "bookId and shelf are required" }, { status: 400 });
    }

    let shelfType: shelf_type;
    try {
      shelfType = parseShelfType(shelfString);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    let statusType: status_type;
    if (statusString) {
      try {
        statusType = parseStatusType(statusString);
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
    } else {
      // Default status for a new entry
      statusType = 'in_progress';
    }

    // 3. Handle "Move" or "Add" Logic
    // Check if the book already exists for this user on *any* shelf
    const existingUserBook = await prisma.userBook.findFirst({
      where: {
        user_id: user.id,
        book_id: bookId,
      },
    });

    if (existingUserBook) {
      // If it exists on a *different* shelf, delete the old entry
      if (existingUserBook.shelf !== shelfType) {
        await prisma.userBook.delete({
          where: {
            user_id_book_id_shelf: { // Use the unique ID from your @@id([]) composite key
              user_id: user.id,
              book_id: bookId,
              shelf: existingUserBook.shelf,
            },
          },
        });
        console.log(`Moved book ${bookId} from ${existingUserBook.shelf} to ${shelfType} for user ${user.id}`);
      } else {
        // If it exists on the SAME shelf, we'll just update its status/position
        console.log(`Updating book ${bookId} on ${shelfType} for user ${user.id}`);
      }
    }

    // 4. Create or Update the UserBook entry
    const userBook = await prisma.userBook.upsert({
      where: {
        user_id_book_id_shelf: {
          user_id: user.id,
          book_id: bookId,
          shelf: shelfType, // This is the target shelf
        },
      },
      update: {
        status: statusType,
        position: position ?? null, // Use null if position is undefined
        added_at: new Date(), // Optionally update added_at on move/update
      },
      create: {
        user_id: user.id,
        book_id: bookId,
        shelf: shelfType,
        status: statusType,
        position: position ?? null,
      },
      include: {
        book: true, // Include book details in the response
      },
    });

    return NextResponse.json(userBook, { status: 200 });

  } catch (error: any) {
    console.error("Error managing user book:", error);
    return NextResponse.json(
      { error: error.message || "Failed to manage book on shelf" },
      { status: 500 }
    );
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


export async function DELETE(req: NextRequest) {
  try {
    // 1. Authenticate User
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { bookId, shelf: shelfString } = await req.json();

    // 2. Validate Input
    if (!bookId || !shelfString) {
      return NextResponse.json({ error: "bookId and shelf are required" }, { status: 400 });
    }

    let shelfType;
    try {
      shelfType = parseShelfType(shelfString);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // 3. Delete the UserBook entry
    const result = await prisma.userBook.delete({
      where: {
        user_id_book_id_shelf: { // Use the unique ID from your @@id([]) composite key
          user_id: user.id,
          book_id: bookId,
          shelf: shelfType,
        },
      },
    });

    return NextResponse.json({ message: "Book successfully removed from shelf" }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting user book:", error);
    // Prisma throws P2025 (RecordNotFound) if the entry doesn't exist for delete.
    // You might want to handle this specifically for a 404 or a more descriptive message.
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Book not found on this shelf for the current user" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to remove book from shelf" },
      { status: 500 }
    );
  }
}