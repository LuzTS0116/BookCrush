import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for discussion API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// PUT: Update a discussion post
export async function PUT(req: NextRequest, { params }: { params: Promise<{ discussionId: string }> }) {
  const { discussionId } = await params;

  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API discussion PUT] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || 'Authentication required' }, { status: 401 });
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
      data: { 
        content: content.trim(),
        updated_at: new Date()
      },
      include: {
        user: { select: { id: true, display_name: true, avatar_url: true } },
      }
    });

    return NextResponse.json(updatedDiscussion, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating discussion ${discussionId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update discussion' }, { status: 500 });
  }
}

// DELETE: Delete a discussion post
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ discussionId: string }> }) {
  const { discussionId } = await params;

  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API discussion DELETE] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || 'Authentication required' }, { status: 401 });
    }

    const discussion = await prisma.clubDiscussion.findUnique({
      where: { id: discussionId },
      include: { 
        club: { 
          select: { 
            owner_id: true,
            memberships: {
              where: { user_id: user.id },
              select: { role: true }
            }
          } 
        } 
      },
    });

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    // Check if user is the author OR the club owner/admin
    const isAuthor = discussion.user_id === user.id;
    const isClubOwner = discussion.club.owner_id === user.id;
    const isClubAdmin = discussion.club.memberships.some(m => m.role === 'ADMIN' || m.role === 'OWNER');

    if (!isAuthor && !isClubOwner && !isClubAdmin) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own posts or you must be a club owner/admin' }, { status: 403 });
    }
    
    // Delete all replies first (manual cascade)
    await prisma.clubDiscussion.deleteMany({ 
      where: { parent_discussion_id: discussionId } 
    });

    // Then delete the main discussion
    await prisma.clubDiscussion.delete({
      where: { id: discussionId },
    });

    return NextResponse.json({ message: 'Discussion deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`Error deleting discussion ${discussionId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete discussion' }, { status: 500 });
  }
} 