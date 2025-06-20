// import { NextRequest, NextResponse } from 'next/server';
// import { fetchBookFromOL } from '@/lib/openLibrary';

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const title  = searchParams.get('title');
//   const author = searchParams.get('author') ?? undefined;
  
//   if (!title) {
//     return NextResponse.json(
//       { error: 'Missing "title" query parameter' },
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
import { createClient } from '@supabase/supabase-js';
import { PrismaClient, ActivityType, ActivityTargetEntityType } from '@prisma/client' ;
import { checkRateLimit, sanitizeInput, logSecurityEvent } from '@/lib/security-utils';
import { prisma } from '@/lib/prisma';



// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for books API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST(req: NextRequest) {
  console.log('[API books POST] Request received');

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API books POST] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API books POST] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    console.log('[API books POST] User authenticated:', user.id);
    
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(user.id, 'book_creation');
    if (!rateLimitCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', user.id, { 
        operation: 'book_creation',
        endpoint: '/api/books' 
      }, req);
      return NextResponse.json({ error: rateLimitCheck.error }, { status: 429 });
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
    
    // Validate and sanitize title
    const titleValidation = sanitizeInput.bookTitle(title);
    if (!titleValidation.isValid) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }

    // Validate and sanitize description
    let sanitizedDescription = '';
    if (description) {
      const descValidation = sanitizeInput.description(description);
      if (!descValidation.isValid) {
        return NextResponse.json({ error: descValidation.error }, { status: 400 });
      }
      sanitizedDescription = descValidation.sanitized;
    }

    // Validate author
    if (!author || typeof author !== 'string' || author.trim().length === 0) {
      return NextResponse.json({ error: 'Author is required' }, { status: 400 });
    }
    
    if (author.length > 100) {
      return NextResponse.json({ error: 'Author name must be less than 100 characters' }, { status: 400 });
    }

    // Validate pages
    if (pages && (typeof pages !== 'number' || pages < 1 || pages > 10000)) {
      return NextResponse.json({ error: 'Pages must be a number between 1 and 10000' }, { status: 400 });
    }

    // Validate rating
    if (rating && (typeof rating !== 'number' || rating < 0 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be a number between 0 and 5' }, { status: 400 });
    }
    
    const genres = subjects && Array.isArray(subjects) 
      ? subjects.slice(0, 5).map((s: string) => s.trim()).filter(s => s.length > 0)
      : [];
    
    const newBook = await prisma.book.create({
      data: {
        title: titleValidation.sanitized,
        author: author.trim(),
        description: sanitizedDescription,
        reading_time: reading_speed || "N/A",
        pages: pages || null,
        genres,
        cover_url: coverUrl || null,
        published_date: publishDate || null,
        rating: rating || null,
        added_by: user.id,
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

    // Create ActivityLog Entry for ADDED_BOOK_TO_LIBRARY
    if (newBook) {
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          activity_type: ActivityType.ADDED_BOOK_TO_LIBRARY,
          target_entity_type: ActivityTargetEntityType.BOOK,
          target_entity_id: newBook.id,
          details: {
            book_title: newBook.title,
            book_author: newBook.author
          }
        }
      });

      // Log successful book creation
      logSecurityEvent('BOOK_CREATED', user.id, {
        bookId: newBook.id,
        title: newBook.title,
        hasFile: !!storageKey
      }, req);
    }
    
    console.log('[API books POST] Book created successfully:', newBook.id);
    return NextResponse.json(newBook, { status: 201 });
  } catch (error: any) {
    console.error("[API books POST] Error creating book:", error);
    
    // Log security event for failed book creation
    logSecurityEvent('BOOK_CREATION_FAILED', 'unknown', {
      error: error.message,
      endpoint: '/api/books'
    }, req);
    
    return NextResponse.json(
      { error: error.message || "Failed to create book" },
      { status: 500 }
    );
  } finally {
    
  }
}

export async function GET(req: NextRequest) {
  console.log('[API books GET] Request received');

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API books GET] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API books GET] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    console.log('[API books GET] User authenticated:', user.id);

    // Get query parameters
    const url = new URL(req.url);
    const limit = url.searchParams.get('limit');
    const latest = url.searchParams.get('latest') === 'true'; // New parameter for dashboard
    const filter = url.searchParams.get('filter') || 'all'; // New parameter for filtering: 'all', 'my-books', 'friends'

    console.log('[API books GET] Filter parameter:', filter);

    // Get user's friends first
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: user.id },
          { userId2: user.id }
        ]
      }
    });

    // Extract friend IDs (excluding current user)
    const friendIds = friendships.map(friendship => 
      friendship.userId1 === user.id ? friendship.userId2 : friendship.userId1
    );

    console.log('[API books GET] User friends:', friendIds.length);

    // Build the where clause based on filter
    let whereClause: any = {};

    switch (filter) {
      case 'my-books':
        whereClause = {
          added_by: user.id
        };
        break;
      case 'friends':
        whereClause = {
          added_by: {
            in: friendIds
          }
        };
        break;
      case 'all':
      default:
        whereClause = {
          added_by: {
            in: [user.id, ...friendIds]
          }
        };
        break;
    }

    // If no friends and filter is 'friends', return empty array
    if (filter === 'friends' && friendIds.length === 0) {
      console.log('[API books GET] No friends found, returning empty array for friends filter');
      return NextResponse.json([]);
    }

    // If no friends and filter is 'all', just show user's books
    if (filter === 'all' && friendIds.length === 0) {
      whereClause = {
        added_by: user.id
      };
    }

    // Get books with all related data in a single optimized query
    const books = await prisma.book.findMany({
      where: whereClause,
      include: {
        file: true,
        creator: {
          select: {
            id: true,
            display_name: true,
            nickname: true,
            avatar_url: true
          }
        },
        // Include ALL UserBook relations for this book
        UserBook: {
          select: {
            user_id: true,
            shelf: true,
            status: true,
            is_favorite: true,
            user: {
              select: {
                display_name: true,
                nickname: true
              }
            }
          }
        },
        // Include ALL reactions for this book
        book_reactions: {
          select: {
            type: true,
            user_id: true
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit ? parseInt(limit) : latest ? 1 : undefined, // Limit for dashboard
    });

    console.log('[API books GET] Found books:', books.length, 'with filter:', filter);

    // Process all data in memory (much faster than multiple DB queries)
    const booksWithReactionCounts = books.map((book) => {
      // Process reactions in memory
      const reactionCounts = book.book_reactions.reduce((acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      }, {} as any);

      // Find user's reaction
      const userReaction = book.book_reactions.find(r => r.user_id === user.id);

      // Find user's shelf status
      const userBook = book.UserBook.find(ub => ub.user_id === user.id);

      // For friends' books, find the friend's shelf status
      let friendShelfStatus = null;
      if (filter === 'friends' && book.added_by !== user.id) {
        const friendBook = book.UserBook.find(ub => ub.user_id === book.added_by);
        if (friendBook) {
          friendShelfStatus = {
            shelf: friendBook.shelf,
            status: friendBook.status,
            user_name: friendBook.user.nickname || friendBook.user.display_name
          };
        }
      }

      // Convert reaction counts to the format needed for the UI
      const counts = {
        HEART: reactionCounts.HEART || 0,
        LIKE: reactionCounts.LIKE || 0,
        THUMBS_UP: reactionCounts.THUMBS_UP || 0,
        THUMBS_DOWN: reactionCounts.THUMBS_DOWN || 0,
        total: reactionCounts.total || 0
      };

      return {
        ...book,
        reactions: {
          counts,
          userReaction: userReaction?.type || null
        },
        is_favorite: userBook?.is_favorite || false,
        // Include creator info for "Added by Friends" display
        added_by_user: book.creator,
        // Include shelf status information
        user_shelf_status: userBook ? {
          shelf: userBook.shelf,
          status: userBook.status
        } : null,
        friend_shelf_status: friendShelfStatus
      };
    });

    console.log('[API books GET] Returning books with reactions:', booksWithReactionCounts.length);
    return NextResponse.json(booksWithReactionCounts);

  } catch (err: any) {
    console.error("[API books GET] Error fetching books:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch books" },
      { status: 500 }
    );
  } finally {
    
  }
}