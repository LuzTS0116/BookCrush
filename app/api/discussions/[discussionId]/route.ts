import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { createApiSupabase } from '@/lib/auth-server'; // Assuming you have this

const prisma = new PrismaClient();

// PUT: Update a discussion post
export async function PUT(req: NextRequest, { params }: { params: { discussionId: string } }) {
  const { discussionId } = params;

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

    const discussion = await prisma.clubDiscussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    if (discussion.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own discussion posts' }, { status: 403 });
    }

    const updatedDiscussion = await prisma.clubDiscussion.update({
      where: { id: discussionId },
      data: { content: content.trim() },
      include: {
        user: { select: { id: true, profile: { select: { display_name: true, id: true } } } },
        // Include replies if needed upon update
      }
    });

    return NextResponse.json(updatedDiscussion, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating discussion ${discussionId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update discussion' }, { status: 500 });
  }
}

// DELETE: Delete a discussion post
export async function DELETE(req: NextRequest, { params }: { params: { discussionId: string } }) {
  const { discussionId } = params;

  try {
    const supabase = createApiSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const discussion = await prisma.clubDiscussion.findUnique({
      where: { id: discussionId },
      include: { club: { select: { owner_id: true } } }, // To check if user is club owner
    });

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    // Check if user is the author OR the club owner
    const isAuthor = discussion.user_id === user.id;
    const isClubOwner = discussion.club.owner_id === user.id;
    // You might want to include Club Admins here as well if you have an ADMIN role in ClubMembership

    if (!isAuthor && !isClubOwner) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own posts or are not a club owner/admin' }, { status: 403 });
    }
    
    // Prisma will handle cascading deletes for replies due to the schema definition if parent_discussion_id is set up with onDelete: Cascade for replies
    // However, our current schema uses onDelete: NoAction for parent_discussion to avoid direct cascade of replies on parent deletion.
    // If you want to delete all replies when a parent is deleted, you'd need to do it manually or change schema.
    // For simplicity here, we are just deleting the specific discussion post.
    // If it's a parent post, its replies will become orphaned unless you handle them.

    // If you want to delete replies too (manual approach if not using cascade on DB level for this specific relation):
    // await prisma.clubDiscussion.deleteMany({ where: { parent_discussion_id: discussionId } });

    await prisma.clubDiscussion.delete({
      where: { id: discussionId },
    });

    return NextResponse.json({ message: 'Discussion deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error: any) {
    console.error(`Error deleting discussion ${discussionId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete discussion' }, { status: 500 });
  }
} 