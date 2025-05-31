import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// Helper to map user data and discussion fields
function mapPrismaDiscussionToFrontend(discussion: any) {
  const mapped = {
    ...discussion,
    text: discussion.content,
    timestamp: discussion.created_at,
    user: discussion.user ? {
      id: discussion.user.id,
      name: discussion.user.display_name || 'Anonymous',
      avatar: discussion.user.avatar_url || null,
      // initials are typically derived client-side
    } : null,
    replies: discussion.replies ? discussion.replies.map(mapPrismaDiscussionToFrontend) : [],
  };
  // Remove original fields if they are not needed directly on frontend
  delete mapped.content;
  delete mapped.created_at;
  delete mapped.user_id; 
  // delete mapped.book_id; // Keep if needed for context on frontend
  // delete mapped.club_id; // Keep if needed for context on frontend
  // delete mapped.parent_discussion_id; // Keep if needed
  if (mapped.user) {
    delete mapped.user.display_name;
    delete mapped.user.avatar_url;
  }
  return mapped;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const clubId = params.id;

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const membership = await prisma.clubMembership.findUnique({
      where: { user_id_club_id: { user_id: authUser.id, club_id: clubId } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not an active member of this club' }, { status: 403 });
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { current_book_id: true },
    });

    // If club not found, or to handle cases where current_book_id might not be relevant for all discussions:
    // For now, we assume discussions are tied to current_book_id or null if no current book.
    const bookIdToFilterBy = club?.current_book_id || null;

    const discussions = await prisma.clubDiscussion.findMany({
      where: {
        club_id: clubId,
        book_id: bookIdToFilterBy, // This will correctly fetch for a specific book_id or for NULL book_id
        parent_discussion_id: null,
      },
      include: {
        user: { select: { id: true, display_name: true, avatar_url: true } },
        book: { select: { id: true, title: true } }, // Keep if you want book title with discussion
        replies: {
          include: {
            user: { select: { id: true, display_name: true, avatar_url: true } },
          },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const mappedDiscussions = discussions.map(mapPrismaDiscussionToFrontend);
    return NextResponse.json(mappedDiscussions, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching discussions for club ${clubId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch discussions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const clubId = params.id;

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Body structure from frontend: { text: string, bookId: string | null }
    const { text, bookId } = await req.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Text (comment content) is required and must be a non-empty string' }, { status: 400 });
    }
    // bookId can be null, so no explicit check for its presence, but type can be checked if needed.

    const membership = await prisma.clubMembership.findUnique({
      where: { user_id_club_id: { user_id: authUser.id, club_id: clubId } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not an active member of this club or membership not found' }, { status: 403 });
    }
    
    // Optional: Further validation for bookId if it's not null
    // For example, check if the bookId actually belongs to the club's history or is the current book.
    // For now, we trust the bookId sent by the client (which can be null).

    const newDiscussion = await prisma.clubDiscussion.create({
      data: {
        club_id: clubId,
        user_id: authUser.id,
        book_id: bookId, // This can be null for general discussions
        content: text.trim(),
      },
      include: {
        user: { select: { id: true, display_name: true } },
        // book: bookId ? { select: { id: true, title: true } } : undefined, // include book if bookId exists
      }
    });
    
    const mappedNewDiscussion = mapPrismaDiscussionToFrontend(newDiscussion);
    return NextResponse.json(mappedNewDiscussion, { status: 201 });

  } catch (error: any) {
    console.error(`Error creating discussion for club ${clubId}:`, error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create discussion' }, { status: 500 });
  }
} 