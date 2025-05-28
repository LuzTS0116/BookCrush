import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { createApiSupabase } from '@/lib/auth-server'; // Assuming you have this from previous steps

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { clubId: string; bookId: string } }) {
  const { clubId, bookId } = params;

  try {
    const supabase = createApiSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user is a member of the club
    const membership = await prisma.clubMembership.findUnique({
      where: { user_id_club_id: { user_id: user.id, club_id: clubId } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not an active member of this club' }, { status: 403 });
    }

    // Fetch discussions for the book in the club, including user details and replies
    const discussions = await prisma.clubDiscussion.findMany({
      where: {
        club_id: clubId,
        book_id: bookId,
        parent_discussion_id: null, // Only fetch top-level discussions
      },
      include: {
        user: { select: { id: true, profile: { select: { display_name: true, id: true } } } }, // Adjust user details as needed
        book: { select: { id: true, title: true } },
        replies: {
          include: {
            user: { select: { id: true, profile: { select: { display_name: true, id: true } } } },
            // Potentially replies of replies if you want deeper nesting, or handle on client
          },
          orderBy: { created_at: 'asc' },
        },
        // If you implement reactions for discussions:
        // _count: { select: { reactions: true } } 
      },
      orderBy: { created_at: 'desc' }, // Show newest discussions first
    });

    return NextResponse.json(discussions, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching discussions for club ${clubId}, book ${bookId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch discussions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { clubId: string; bookId: string } }) {
  const { clubId, bookId } = params;

  try {
    const supabase = createApiSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { content } = await req.json();

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required and must be a non-empty string' }, { status: 400 });
    }

    // Verify user is a member of the club
    const membership = await prisma.clubMembership.findUnique({
      where: { user_id_club_id: { user_id: user.id, club_id: clubId } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not an active member of this club' }, { status: 403 });
    }
    
    // Optional: Verify the bookId is indeed the current book for the club, or a book previously read.
    // This logic depends on your application rules.
    // For simplicity, we are not checking it here but you should consider it.
    // const club = await prisma.club.findUnique({ where: { id: clubId } });
    // if (!club || club.current_book_id !== bookId) {
    //   return NextResponse.json({ error: 'Discussion can only be for the current club book' }, { status: 400 });
    // }

    const newDiscussion = await prisma.clubDiscussion.create({
      data: {
        club_id: clubId,
        user_id: user.id,
        book_id: bookId,
        content: content.trim(),
        // parent_discussion_id will be null for top-level posts
      },
      include: {
        user: { select: { id: true, profile: { select: { display_name: true, id: true } } } },
      }
    });

    return NextResponse.json(newDiscussion, { status: 201 });

  } catch (error: any) {
    console.error(`Error creating discussion for club ${clubId}, book ${bookId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to create discussion' }, { status: 500 });
  }
} 