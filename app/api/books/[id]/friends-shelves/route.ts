import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/prisma';




export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const bookId = params.id;

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
            nickname: true,
            avatar_url: true,
          }
        },
        user_two: {
          select: {
            id: true,
            display_name: true,
            nickname: true,
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
            nickname: true,
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
    const formattedFriends = friendsWithBook.map(userBook => ({
      id: userBook.user.id,
      name: userBook.user.display_name || userBook.user.nickname || 'Unknown',
      nickname: userBook.user.nickname,
      avatar: userBook.user.avatar_url,
      initials: (userBook.user.display_name || userBook.user.nickname || 'U').charAt(0).toUpperCase(),
      shelf: userBook.shelf,
      status: userBook.status,
      media_type: userBook.media_type,
      added_at: userBook.added_at,
      is_favorite: userBook.is_favorite,
    }));

    return NextResponse.json(formattedFriends, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching friends' shelves:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch friends' shelves" }, { status: 500 });
  } finally {
    
  }
} 