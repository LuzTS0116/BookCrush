import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ActivityType, ActivityTargetEntityType } from '@prisma/client';
import { parseShelfType, parseStatusType } from '@/lib/enum'; // Import your enum parser
import {  shelf_type, status_type  } from '@prisma/client';
import {prisma} from '@/lib/prisma'
import { checkBookCompletionAchievements } from './achievement-integration';
import { CustomGoalsService } from '@/lib/custom-goals-service';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for shelf API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }
    
  try {
    // Bearer token authentication (consistent with books API)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || "Authentication required" }, { status: 401 });
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
      include: { 
        book: { select: { title: true } } // Ensure title is fetched for activity log
      }
    });

    let previousShelf = existingUserBook?.shelf;
    let previousStatus = existingUserBook?.status;
    // Use book title from existingUserBook if available, otherwise it will be fetched from userBook after upsert
    let bookTitleForActivity = existingUserBook?.book?.title || 'A book'; 

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

    // 4. Auto-assign position if not provided and this is a new entry for the queue
    let finalPosition = position;
    if (!finalPosition && !existingUserBook && shelfType === shelf_type.queue) {
      // Get the highest position for this user's queue and add 1
      const maxPositionBook = await prisma.userBook.findFirst({
        where: {
          user_id: user.id,
          shelf: shelf_type.queue,
        },
        orderBy: {
          position: 'desc',
        },
        select: {
          position: true,
        },
      });
      finalPosition = (maxPositionBook?.position || 0) + 1;
    }

    // 5. Create or Update the UserBook entry
    const userBook = await prisma.userBook.upsert({
      where: {
        user_id_book_id_shelf: {
          user_id: user.id,
          book_id: bookId,
          shelf: shelfType, 
        },
      },
      update: {
        status: statusType,
        position: finalPosition ?? null, 
        added_at: new Date(), 
        shelf: statusType === status_type.finished || statusType === status_type.unfinished ? shelf_type.history : shelfType,
      },
      create: {
        user_id: user.id,
        book_id: bookId,
        shelf: statusType === status_type.finished || statusType === status_type.unfinished ? shelf_type.history : shelfType,
        status: statusType,
        position: finalPosition ?? null,
      },
      include: {
        book: true, 
      },
    });

    // --- Create ActivityLog Entry ---
    // Ensure bookTitle is up-to-date from the upserted record, especially if it was a new book
    bookTitleForActivity = userBook.book?.title || bookTitleForActivity;

    if (statusType === status_type.finished) {
      if (previousStatus === status_type.in_progress || previousStatus === status_type.almost_done) {
        await prisma.activityLog.create({
          data: {
            user_id: user.id,
            activity_type: ActivityType.FINISHED_READING_BOOK,
            target_entity_type: ActivityTargetEntityType.USER_BOOK,
            target_entity_id: userBook.book_id,
            details: { book_title: bookTitleForActivity, shelf_name: userBook.shelf.toString() }
          }
        });
        
        // Check for achievements after book completion
        await checkBookCompletionAchievements(user.id, userBook.book_id, statusType);
        
        // Update custom goal progress when book is finished
        await CustomGoalsService.updateCustomGoalProgress(user.id);
      }
    } else if (!existingUserBook || previousShelf !== shelfType) {
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          activity_type: ActivityType.ADDED_BOOK_TO_SHELF,
          target_entity_type: ActivityTargetEntityType.USER_BOOK,
          target_entity_id: userBook.book_id,
          target_entity_secondary_id: userBook.shelf.toString(), 
          details: {
            book_title: bookTitleForActivity,
            shelf_name: userBook.shelf.toString(),
            previous_shelf: previousShelf 
          }
        }
      });
    } else if (existingUserBook && previousStatus !== statusType) {
      // Log changing status on the same shelf
              await prisma.activityLog.create({
          data: {
            user_id: user.id,
            activity_type: ActivityType.CHANGED_BOOK_STATUS,
            target_entity_type: ActivityTargetEntityType.USER_BOOK,
            target_entity_id: userBook.book_id,
            target_entity_secondary_id: userBook.status?.toString() || '', 
            details: {
              book_title: bookTitleForActivity,
              shelf_name: userBook.shelf.toString(), 
              old_status: previousStatus,
              new_status: userBook.status?.toString() || '',
            }
          }
        });
    }
    // --- End ActivityLog Entry ---

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
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }
  try {
    // Bearer token authentication (consistent with books API)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || "Authentication required" }, { status: 401 });
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
      orderBy: shelfType === shelf_type.queue 
        ? [
            { position: 'asc' }, // Order by position for queue (nulls last)
            { added_at: 'desc' }, // Then by added_at for items without position
          ]
        : { added_at: 'desc' }, // Default ordering for other shelves
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
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }
  try {
    // Bearer token authentication (consistent with books API)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || "Authentication required" }, { status: 401 });
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