import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { checkRecommendationAchievements } from './achievement-integration';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check environment variables.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// GET /api/recommendations - Fetch user's recommendations (inbox + sent)
export async function GET(request: NextRequest) {
  if (!supabase) {
    console.error('[API recommendations] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API recommendations] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'inbox' or 'sent'

    if (type === 'inbox') {
      // Get received recommendations
      const recommendations = await prisma.bookRecommendation.findMany({
        where: {
          to_user_id: user.id,
          status: { in: ['PENDING', 'READ'] }
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              cover_url: true,
              genres: true,
              description: true,
              pages: true,
              reading_time: true
            }
          },
          from_user: {
            select: {
              id: true,
              display_name: true,
              avatar_url: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return NextResponse.json({ recommendations }, { status: 200 });

    } else if (type === 'sent') {
      // Get sent recommendations
      const recommendations = await prisma.bookRecommendation.findMany({
        where: {
          from_user_id: user.id
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              cover_url: true,
              description: true
            }
          },
          to_user: {
            select: {
              id: true,
              display_name: true,
              avatar_url: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return NextResponse.json({ recommendations }, { status: 200 });

    } else {
      // Get both inbox and sent for overview
      const [inbox, sent] = await Promise.all([
        prisma.bookRecommendation.findMany({
          where: {
            to_user_id: user.id,
            status: { in: ['PENDING', 'READ'] }
          },
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
          },
          orderBy: { created_at: 'desc' },
          take: 10 // Limit for overview
        }),
        prisma.bookRecommendation.findMany({
          where: {
            from_user_id: user.id
          },
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                cover_url: true
              }
            },
            to_user: {
              select: {
                id: true,
                display_name: true,
                avatar_url: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 10 // Limit for overview
        })
      ]);

      return NextResponse.json({ inbox, sent }, { status: 200 });
    }

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/recommendations - Send a new recommendation
export async function POST(request: NextRequest) {
  if (!supabase) {
    console.error('[API recommendations] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API recommendations] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, toUserId, note } = body;

    if (!bookId || !toUserId) {
      return NextResponse.json({ error: 'Book ID and recipient user ID are required' }, { status: 400 });
    }

    // Validate that users are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: user.id, userId2: toUserId },
          { userId1: toUserId, userId2: user.id }
        ]
      }
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Can only recommend books to friends' }, { status: 403 });
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check for existing recommendation
    const existingRec = await prisma.bookRecommendation.findUnique({
      where: {
        book_id_from_user_id_to_user_id: {
          book_id: bookId,
          from_user_id: user.id,
          to_user_id: toUserId
        }
      }
    });

    if (existingRec) {
      // Update existing recommendation instead of creating new
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
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              cover_url: true
            }
          },
          to_user: {
            select: {
              id: true,
              display_name: true
            }
          }
        }
      });

      // Create activity log for sender
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          activity_type: 'SENT_BOOK_RECOMMENDATION',
          target_entity_type: 'BOOK_RECOMMENDATION',
          target_entity_id: updatedRec.id,
          related_user_id: toUserId,
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
          user_id: toUserId,
          activity_type: 'RECEIVED_BOOK_RECOMMENDATION',
          target_entity_type: 'BOOK_RECOMMENDATION',
          target_entity_id: updatedRec.id,
          related_user_id: user.id,
          details: {
            book_title: book.title,
            book_id: bookId,
            note: note?.substring(0, 100)
          }
        }
      });

      // Check for achievements after updating recommendation
      await checkRecommendationAchievements(user.id, toUserId, bookId);

      return NextResponse.json({ 
        recommendation: updatedRec,
        message: 'Recommendation updated successfully'
      }, { status: 200 });
    } else {
      // Create new recommendation
      const newRec = await prisma.bookRecommendation.create({
        data: {
          book_id: bookId,
          from_user_id: user.id,
          to_user_id: toUserId,
          note: note
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              cover_url: true
            }
          },
          to_user: {
            select: {
              id: true,
              display_name: true
            }
          }
        }
      });

      // Create activity log for sender
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          activity_type: 'SENT_BOOK_RECOMMENDATION',
          target_entity_type: 'BOOK_RECOMMENDATION',
          target_entity_id: newRec.id,
          related_user_id: toUserId,
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
          user_id: toUserId,
          activity_type: 'RECEIVED_BOOK_RECOMMENDATION',
          target_entity_type: 'BOOK_RECOMMENDATION',
          target_entity_id: newRec.id,
          related_user_id: user.id,
          details: {
            book_title: book.title,
            book_id: bookId,
            note: note?.substring(0, 100)
          }
        }
      });

      // Check for achievements after sending new recommendation
      await checkRecommendationAchievements(user.id, toUserId, bookId);

      // Send push notification to recipient
      try {
        const senderProfile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: { display_name: true }
        });

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientId: toUserId,
            bookTitle: book.title,
            senderName: senderProfile?.display_name || 'A friend'
          })
        });
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        // Don't fail the recommendation creation if push notification fails
      }

      return NextResponse.json({ 
        recommendation: newRec,
        message: 'Recommendation sent successfully'
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 