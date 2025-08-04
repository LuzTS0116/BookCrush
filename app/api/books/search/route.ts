import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json([])
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    const supabase = createRouteHandlerClient({ cookies })

    // Require Bearer token authentication (consistent with other APIs)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Search API] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[Search API] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    console.log('[Search API] User authenticated:', user.id);

    // Test early return to isolate authentication issues
    if (query === 'test_auth') {
      return NextResponse.json([{ message: 'Authentication successful', userId: user.id }]);
    }

    // Clean and prepare search terms
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)
    
    // Get user's friends first (same as regular books API)
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

    // Get all books with full data structure (same as regular books API)
    const books = await prisma.book.findMany({
      include: {
        file: true,
        creator: {
          select: {
            id: true,
            display_name: true,
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
                display_name: true
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
    });

    console.log(`[Search API] Retrieved ${books?.length || 0} books from database`);
    
    // Debug: Log a sample of books with alternate_titles
    if (books && books.length > 0) {
      const booksWithAlternateTitles = books.filter(book => book.alternate_titles && book.alternate_titles.length > 0);
      console.log(`[Search API] Found ${booksWithAlternateTitles.length} books with alternate_titles`);
      if (booksWithAlternateTitles.length > 0) {
        console.log(`[Search API] Sample book with alternate_titles:`, {
          title: booksWithAlternateTitles[0].title,
          alternate_titles: booksWithAlternateTitles[0].alternate_titles
        });
      }
    }

    // Enhanced filtering to search through all fields including alternate_titles
    const filteredBooks = (books || []).filter(book => {
      const searchLower = query.toLowerCase();
      
      // Check main title
      const titleMatch = book.title?.toLowerCase().includes(searchLower);
      
      // Check author
      const authorMatch = book.author?.toLowerCase().includes(searchLower);
      
      // Check genres
      const genreMatch = book.genres?.some((genre: string) => 
        genre.toLowerCase().includes(searchLower)
      );
      
      // Check alternate titles - both full query and individual terms
      let alternateMatch = false;
      if (book.alternate_titles && Array.isArray(book.alternate_titles)) {
        alternateMatch = book.alternate_titles.some((altTitle: string) => {
          const altTitleLower = altTitle.toLowerCase();
          // Check if full query matches
          const fullMatch = altTitleLower.includes(searchLower);
          // Check if any search term matches (for multi-word searches)
          const termMatch = searchTerms.some(term => altTitleLower.includes(term));
          return fullMatch || termMatch;
        });
      }
      
      const isMatch = titleMatch || authorMatch || genreMatch || alternateMatch;
      
      return isMatch;
    })

    // Debug logging for search results (after filteredBooks is created)
    console.log(`[Search API] Filtered ${filteredBooks.length} books for query: "${query}"`);
    if (filteredBooks.length > 0 && filteredBooks.length <= 3) {
      console.log(`[Search API] Sample matches:`, filteredBooks.slice(0, 2).map(book => ({
        title: book.title,
        author: book.author,
        alternate_titles: book.alternate_titles
      })));
    }

    // Process all data in memory (same as regular books API)
    const booksWithReactionCounts = filteredBooks.map((book) => {
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
      const friendBook = book.UserBook.find(ub => friendIds.includes(ub.user_id));
      if (friendBook) {
        friendShelfStatus = {
          shelf: friendBook.shelf,
          status: friendBook.status,
          user_name: friendBook.user.display_name
        };
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

    // Apply pagination to processed results
    const paginatedBooks = booksWithReactionCounts.slice(skip, skip + limit)
    
    console.log(`[Search API] Query: "${query}", Page: ${page}, Results: ${paginatedBooks.length}/${booksWithReactionCounts.length}`)
    
    // Additional debug info for specific searches
    if (query.toLowerCase().includes('atomic') || query.toLowerCase().includes('hábito')) {
      console.log(`[Search API] Debug for "${query}":`, {
        totalBooks: books?.length || 0,
        filteredCount: booksWithReactionCounts.length,
        sampleMatches: booksWithReactionCounts.slice(0, 2).map(book => ({
          title: book.title,
          alternate_titles: book.alternate_titles
        }))
      });
    }
    
    return NextResponse.json(paginatedBooks)

  } catch (error: any) {
    console.error('[Search API] Detailed error in book search:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      query: new URL(request.url).searchParams.get('q')
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to search books',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 