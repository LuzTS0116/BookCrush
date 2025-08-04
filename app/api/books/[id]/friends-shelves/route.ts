import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { getAvatarPublicUrlServer } from '@/lib/supabase-server-utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for books API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(
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
      console.error('[API books POST] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API books POST] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const bookId = id;

    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: user.id },
          { userId2: user.id },
        ],
      },
      include: {
        user_one: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true,
          }
        },
        user_two: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true,
          }
        }
      },
    });

    // Extract friend IDs (excluding current user)
    const friendIds = friendships.map(friendship => 
      friendship.userId1 === user.id ? friendship.userId2 : friendship.userId1
    );

    if (friendIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Get friends who have this book on their shelves
    const friendsWithBook = await prisma.userBook.findMany({
      where: {
        book_id: bookId,
        user_id: {
          in: friendIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true,
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            cover_url: true,
          }
        }
      },
      orderBy: {
        added_at: 'desc'
      }
    });

    // Format the response
    const preFormat = friendsWithBook.map(userBook => ({
      id: userBook.user.id,
      name: userBook.user.display_name || 'Unknown',
      avatar: userBook.user.avatar_url,
      initials: (userBook.user.display_name || 'U').charAt(0).toUpperCase(),
      shelf: userBook.shelf,
      status: userBook.status,
      media_type: userBook.media_type,
      added_at: userBook.added_at,
      is_favorite: userBook.is_favorite,
    }));

    // Format the friends with proper avatar URLs
    const formattedFriends = await Promise.all(preFormat.map(async (friend) => {
      if (friend.avatar) {
        return {
          ...friend,
          avatar:  await getAvatarPublicUrlServer(supabase!, friend.avatar)
        };
      }
      return friend;
    }));

    return NextResponse.json(formattedFriends, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching friends' shelves:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch friends' shelves" }, { status: 500 });
  } finally {
    
  }
} 