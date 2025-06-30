import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ActivityType, ActivityTargetEntityType } from '@prisma/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getAvatarPublicUrlServer } from '@/lib/supabase-server-utils';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for club discussions API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Helper to map user data and discussion fields
async function mapPrismaDiscussionToFrontend(discussion: any) {
  const mapped = {
    id: discussion.id,
    content: discussion.content, // Keep as content, not text
    created_at: discussion.created_at, // Keep as created_at, not timestamp
    updated_at: discussion.updated_at,
    parent_discussion_id: discussion.parent_discussion_id,
    user: discussion.user ? {
      id: discussion.user.id,
      display_name: discussion.user.display_name || 'Anonymous',
      avatar_url: await getAvatarPublicUrlServer(supabase!, discussion.user.avatar_url),
    } : null,
    replies: discussion.replies ? await Promise.all(discussion.replies.map((reply: any) => mapPrismaDiscussionToFrontend(reply))) : [],
  };
  return mapped;
}

export async function GET(
  request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;

  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API club discussions GET] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: authError?.message || 'Authentication required' }, { status: 401 });
    }

    const membership = await prisma.clubMembership.findUnique({
      where: { user_id_club_id: { user_id: authUser.id, club_id: id } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not an active member of this club' }, { status: 403 });
    }

    const club = await prisma.club.findUnique({
      where: { id: id},
      select: { current_book_id: true },
    });

    // If club not found, or to handle cases where current_book_id might not be relevant for all discussions:
    // For now, we assume discussions are tied to current_book_id or null if no current book.
    const bookIdToFilterBy = club?.current_book_id || null;

    const discussions = await prisma.clubDiscussion.findMany({
      where: {
        club_id: id,
        book_id: bookIdToFilterBy || undefined, // Convert null to undefined for Prisma
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

    const mappedDiscussions = await Promise.all(discussions.map((discussion) => mapPrismaDiscussionToFrontend(discussion)));
    return NextResponse.json(mappedDiscussions, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching discussions for club ${id}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch discussions' }, { status: 500 });
  } finally {
    
  }
}

export async function POST(
  req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;

  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API club discussions POST] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: authError?.message || 'Authentication required' }, { status: 401 });
    }

    // Body structure from frontend: { text: string, bookId: string | null }
    const { text, bookId } = await req.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Text (comment content) is required and must be a non-empty string' }, { status: 400 });
    }
    // bookId can be null, so no explicit check for its presence, but type can be checked if needed.

    const membership = await prisma.clubMembership.findUnique({
      where: { user_id_club_id: { user_id: authUser.id, club_id: id } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not an active member of this club or membership not found' }, { status: 403 });
    }
    
    // Optional: Further validation for bookId if it's not null
    // For example, check if the bookId actually belongs to the club's history or is the current book.
    // For now, we trust the bookId sent by the client (which can be null).

    const newDiscussion = await prisma.clubDiscussion.create({
      data: {
        club_id: id,
        user_id: authUser.id,
        book_id: bookId || undefined, // Convert null to undefined for Prisma
        content: text.trim(),
      },
      include: {
        user: { select: { id: true, display_name: true, avatar_url: true } },
        club: { select: { id: true, name: true } },
        book: bookId ? { select: { id: true, title: true } } : undefined,
        replies: {
          include: {
            user: { select: { id: true, display_name: true, avatar_url: true } },
          },
          orderBy: { created_at: 'asc' },
        },
      }
    });

    // Create activity log for club discussion
    try {
      await prisma.activityLog.create({
        data: {
          user_id: authUser.id,
          activity_type: ActivityType.POSTED_CLUB_DISCUSSION,
          target_entity_type: ActivityTargetEntityType.CLUB_DISCUSSION,
          target_entity_id: newDiscussion.id,
          target_entity_secondary_id: id, // Store club_id for context
          details: {
            club_name: newDiscussion.club?.name,
            book_title: newDiscussion.book?.title || null,
            discussion_preview: text.trim().substring(0, 100) + (text.trim().length > 100 ? '...' : ''),
          }
        }
      });
    } catch (activityError) {
      console.error('Failed to create activity log for club discussion:', activityError);
      // Don't fail the main request if activity logging fails
    }
    
    const mappedNewDiscussion = await mapPrismaDiscussionToFrontend(newDiscussion);
    return NextResponse.json(mappedNewDiscussion, { status: 201 });

  } catch (error: any) {
    console.error(`Error creating discussion for club ${id}:`, error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create discussion' }, { status: 500 });
  } finally {
    
  }
} 