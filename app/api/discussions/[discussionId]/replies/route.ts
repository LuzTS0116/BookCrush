import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createApiSupabase } from '@/lib/auth-server'; // Assuming you have this

const prisma = new PrismaClient();

// POST: Create a reply to a discussion post
export async function POST(req: NextRequest, { params }: { params: { discussionId: string } }) {
  const { discussionId: parent_discussion_id } = params; // This is the ID of the post being replied to

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

    // Find the parent discussion to get its club_id and book_id
    const parentDiscussion = await prisma.clubDiscussion.findUnique({
      where: { id: parent_discussion_id },
      select: { club_id: true, book_id: true }, // We need these to link the reply correctly
    });

    if (!parentDiscussion) {
      return NextResponse.json({ error: 'Parent discussion not found' }, { status: 404 });
    }

    // Verify user is a member of the club associated with the parent discussion
    const membership = await prisma.clubMembership.findUnique({
      where: { user_id_club_id: { user_id: user.id, club_id: parentDiscussion.club_id } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not an active member of this club' }, { status: 403 });
    }

    const newReply = await prisma.clubDiscussion.create({
      data: {
        club_id: parentDiscussion.club_id, // Inherit from parent
        user_id: user.id,
        book_id: parentDiscussion.book_id, // Inherit from parent
        content: content.trim(),
        parent_discussion_id: parent_discussion_id, // Link to the parent post
      },
      include: {
        user: { select: { id: true, profile: { select: { display_name: true, id: true } } } },
      }
    });

    return NextResponse.json(newReply, { status: 201 });

  } catch (error: any) {
    console.error(`Error creating reply for discussion ${parent_discussion_id}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to create reply' }, { status: 500 });
  }
} 