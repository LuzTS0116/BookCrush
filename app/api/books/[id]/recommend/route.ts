import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/push-notifications';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check environment variables.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// POST /api/books/[id]/recommend - Quick recommend this specific book
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    console.error('[API books/[id]/recommend] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API books/[id]/recommend] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const { id: bookId } = await params;
    const body = await request.json();
    const { friendIds, note } = body; // Array of friend IDs to recommend to

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
      return NextResponse.json({ error: 'At least one friend ID is required' }, { status: 400 });
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Validate friendships and create recommendations
    const results = [];
    const errors = [];

    for (const friendId of friendIds) {
      try {
        // Validate friendship
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userId1: user.id, userId2: friendId },
              { userId1: friendId, userId2: user.id }
            ]
          }
        });

        if (!friendship) {
          errors.push({ friendId, error: 'Not friends with this user' });
          continue;
        }

        // Check for existing recommendation
        const existingRec = await prisma.bookRecommendation.findUnique({
          where: {
            book_id_from_user_id_to_user_id: {
              book_id: bookId,
              from_user_id: user.id,
              to_user_id: friendId
            }
          }
        });

        if (existingRec) {
          // Update existing recommendation
          const updatedRec = await prisma.bookRecommendation.update({
            where: { id: existingRec.id },
            data: {
              note: note,
              status: 'PENDING',
              created_at: new Date(),
              read_at: null,
              responded_at: null
            },
            include: {
              to_user: {
                select: {
                  id: true,
                  display_name: true
                }
              }
            }
          });

          results.push({
            friendId,
            recommendation: updatedRec,
            action: 'updated'
          });
        } else {
          // Create new recommendation
          const newRec = await prisma.bookRecommendation.create({
            data: {
              book_id: bookId,
              from_user_id: user.id,
              to_user_id: friendId,
              note: note
            },
            include: {
              to_user: {
                select: {
                  id: true,
                  display_name: true
                }
              }
            }
          });

          results.push({
            friendId,
            recommendation: newRec,
            action: 'created'
          });
        }

        // Send push notification for new recommendations only
        if (!existingRec) {
          try {
            console.log('=== RECOMMENDATION PUSH DEBUG ===')
            console.log('Attempting to send push notification to:', friendId)
            
            const senderProfile = await prisma.profile.findUnique({
              where: { id: user.id },
              select: { display_name: true }
            });

            console.log('Sender profile:', senderProfile)

            const pushResult = await sendPushNotification(
              friendId,
              book.title,
              senderProfile?.display_name || 'A friend'
            );
            
            console.log('Push notification result:', pushResult);
          } catch (pushError) {
            console.error('Error sending push notification:', pushError);
            // Don't fail the recommendation creation if push notification fails
          }
        }

        // Create activity log for sender
        await prisma.activityLog.create({
          data: {
            user_id: user.id,
            activity_type: 'SENT_BOOK_RECOMMENDATION',
            target_entity_type: 'BOOK_RECOMMENDATION',
            target_entity_id: results[results.length - 1].recommendation.id,
            related_user_id: friendId,
            details: {
              book_title: book.title,
              book_id: bookId,
              note: note?.substring(0, 100)
            }
          }
        });

        // Create activity log for receiver
        await prisma.activityLog.create({
          data: {
            user_id: friendId,
            activity_type: 'RECEIVED_BOOK_RECOMMENDATION',
            target_entity_type: 'BOOK_RECOMMENDATION',
            target_entity_id: results[results.length - 1].recommendation.id,
            related_user_id: user.id,
            details: {
              book_title: book.title,
              book_id: bookId,
              note: note?.substring(0, 100)
            }
          }
        });

      } catch (error) {
        console.error(`Error creating recommendation for friend ${friendId}:`, error);
        errors.push({ friendId, error: 'Failed to create recommendation' });
      }
    }

    return NextResponse.json({
      success: results,
      errors: errors,
      message: `Successfully sent ${results.length} recommendation(s)`
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating book recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 