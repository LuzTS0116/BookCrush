import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check environment variables.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// PATCH /api/recommendations/[id] - Update recommendation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    console.error('[API recommendations/[id]] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API recommendations/[id]] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    // Get the recommendation first to verify ownership
    const recommendation = await prisma.bookRecommendation.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // Only the recipient can update the status
    if (recommendation.to_user_id !== user.id) {
      return NextResponse.json({ error: 'You can only update recommendations sent to you' }, { status: 403 });
    }

    let updateData: any = {};
    let activityType: string | null = null;

    if (status) {
      updateData.status = status;
      updateData.responded_at = new Date();

      // Set read_at if this is the first time being read
      if (status === 'READ' && !recommendation.read_at) {
        updateData.read_at = new Date();
      }

      if (status === 'ADDED') {
        activityType = 'ACCEPTED_BOOK_RECOMMENDATION';
      }
    }

    // Handle special actions
    if (action === 'addToShelf') {
      // Add book to user's shelf (you can specify which shelf)
      const shelfType = body.shelf || 'queue'; // Default to queue
      
      try {
        // Check if book is already on this shelf
        const existingUserBook = await prisma.userBook.findUnique({
          where: {
            user_id_book_id_shelf: {
              user_id: user.id,
              book_id: recommendation.book_id,
              shelf: shelfType as any
            }
          }
        });

        if (!existingUserBook) {
          // Add book to shelf
          await prisma.userBook.create({
            data: {
              user_id: user.id,
              book_id: recommendation.book_id,
              shelf: shelfType as any,
              status: shelfType === 'currently_reading' ? 'in_progress' : 'in_progress'
            }
          });
        }

        updateData.status = 'ADDED';
        updateData.responded_at = new Date();
        activityType = 'ACCEPTED_BOOK_RECOMMENDATION';
      } catch (shelfError) {
        console.error('Error adding book to shelf:', shelfError);
        return NextResponse.json({ error: 'Failed to add book to shelf' }, { status: 500 });
      }
    }

    // Update the recommendation
    const updatedRecommendation = await prisma.bookRecommendation.update({
      where: { id },
      data: updateData,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            cover_url: true
          }
        },
        from_user: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true
          }
        }
      }
    });

    // Create activity log if needed
    if (activityType) {
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          activity_type: activityType as any,
          target_entity_type: 'BOOK_RECOMMENDATION',
          target_entity_id: recommendation.id,
          related_user_id: recommendation.from_user_id,
          details: {
            book_title: recommendation.book.title,
            book_id: recommendation.book_id
          }
        }
      });
    }

    return NextResponse.json({ 
      recommendation: updatedRecommendation,
      message: 'Recommendation updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/recommendations/[id] - Delete recommendation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    console.error('[API recommendations/[id]] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API recommendations/[id]] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    // Get the recommendation first to verify ownership
    const recommendation = await prisma.bookRecommendation.findUnique({
      where: { id }
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // Only the sender can delete the recommendation
    if (recommendation.from_user_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete recommendations you sent' }, { status: 403 });
    }

    // Delete the recommendation
    await prisma.bookRecommendation.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Recommendation deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 