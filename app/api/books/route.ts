// import { NextRequest, NextResponse } from 'next/server';
// import { fetchBookFromOL } from '@/lib/openLibrary';

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const title  = searchParams.get('title');
//   const author = searchParams.get('author') ?? undefined;
  
//   if (!title) {
//     return NextResponse.json(
//       { error: 'Missing “title” query parameter' },
//       { status: 400 },
//     );
//   }

//   const book = await fetchBookFromOL(title, author);

//   if (!book) {
//     return NextResponse.json(
//       { error: 'Book not found' },
//       { status: 404 },
//     );
//   }

//   return NextResponse.json(book);  // 200 OK
// }

// app/api/books/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient, ActivityType, ActivityTargetEntityType } from '@/lib/generated/prisma';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = await cookies();
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
    const { 
      title, 
      author, 
      description, 
      reading_speed, 
      pages, 
      subjects, 
      coverUrl,
      storageKey, 
      originalName, 
      size,
      publishDate,
      rating
    } = body;
    
    const genres = subjects && Array.isArray(subjects) 
      ? subjects.slice(0, 5).map((s: string) => s.trim()) // Added type for s
      : [];
    
    const newBook = await prisma.book.create({ // Renamed to newBook for clarity
      data: {
        title,
        author,
        description: description || "",
        reading_time: reading_speed || "N/A",
        pages: pages || null,
        genres,
        cover_url: coverUrl || null,
        published_date: publishDate || null,
        rating: rating || null,
        added_by: user.id, // This is the user who is adding the book
        file: storageKey ? { 
          create: { 
            storage_key: storageKey, 
            original_name: originalName, 
            mime_type: 'application/epub+zip', 
            size_bytes: size 
          } 
        } : undefined
      },
      include: { file: true }
    });

    // --- Create ActivityLog Entry for ADDED_BOOK_TO_LIBRARY ---
    if (newBook) {
      await prisma.activityLog.create({
        data: {
          user_id: user.id, // The user who added the book
          activity_type: ActivityType.ADDED_BOOK_TO_LIBRARY,
          target_entity_type: ActivityTargetEntityType.BOOK,
          target_entity_id: newBook.id,
          details: {
            book_title: newBook.title,
            book_author: newBook.author
          }
        }
      });
    }
    // --- End ActivityLog Entry ---
    
    return NextResponse.json(newBook, { status: 201 });
  } catch (error: any) { // Explicitly type error as any
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create book" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get all books 
    const books = await prisma.book.findMany({
      include: {
        file: true, 
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Get reaction counts for each book and include user's reaction
    const booksWithReactionCounts = await Promise.all(books.map(async (book) => {
      // Get reaction counts
      const reactionCounts = await prisma.reaction.groupBy({
        by: ['type'],
        where: {
          target_type: 'BOOK',
          target_id: book.id
        },
        _count: {
          id: true
        }
      });

      // Get user's reaction to this book
      const userReaction = await prisma.reaction.findFirst({
        where: {
          user_id: user.id,
          target_type: 'BOOK',
          target_id: book.id
        },
        select: {
          type: true
        }
      });

      // Get favorite status from user_books
      const userBook = await prisma.userBook.findFirst({
        where: {
          user_id: user.id,
          book_id: book.id
        },
        select: {
          is_favorite: true
        }
      });

      // Convert reaction counts to the format needed for the UI
      const counts = {
        HEART: 0,
        LIKE: 0,
        THUMBS_UP: 0,
        THUMBS_DOWN: 0,
        total: 0
      };

      reactionCounts.forEach(rc => {
        counts[rc.type] = rc._count.id;
        counts.total += rc._count.id;
      });

      return {
        ...book,
        reactions: {
          counts,
          userReaction: userReaction?.type || null
        },
        is_favorite: userBook?.is_favorite || false
      };
    }));

    return NextResponse.json(booksWithReactionCounts);

  } catch (err: any) {
    console.error("Error fetching books:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch books" },
      { status: 500 }
    );
  }
}