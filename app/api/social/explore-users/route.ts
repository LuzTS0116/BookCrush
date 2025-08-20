// app/api/social/explore-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatProfileWithAvatarUrlServer } from '@/lib/supabase-server-utils';
import { prisma } from '@/lib/prisma';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for explore-users API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;



export async function GET(req: NextRequest) {
  // console.log('[API explore-users GET] Request received');

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // console.error('[API explore-users GET] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      // console.error('[API explore-users GET] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    // console.log('[API explore-users GET] User authenticated:', user.id);
    const currentUserId = user.id;
    
    // 1. Get existing friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: currentUserId },
          { userId2: currentUserId },
        ],
      },
      select: {
        userId1: true,
        userId2: true,
      },
    });

    const friendUserIds = new Set<string>();
    friendships.forEach(f => {
      if (f.userId1 !== currentUserId) friendUserIds.add(f.userId1);
      if (f.userId2 !== currentUserId) friendUserIds.add(f.userId2);
    });

    // 2. Get pending friend requests
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: currentUserId, status: 'PENDING' },
          { receiverId: currentUserId, status: 'PENDING' },
        ],
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
      },
    });

    // Create maps for quick lookup
    const sentRequestsMap = new Map<string, string>(); // userId -> requestId
    const receivedRequestsMap = new Map<string, string>(); // userId -> requestId
    
    friendRequests.forEach(fr => {
      if (fr.senderId === currentUserId) {
        sentRequestsMap.set(fr.receiverId, fr.id);
      } else if (fr.receiverId === currentUserId) {
        receivedRequestsMap.set(fr.senderId, fr.id);
      }
    });

    // 3. Fetch all users with their profiles, excluding only current user and existing friends
    const explorableUsers = await prisma.profile.findMany({
      where: {
        id: {
          notIn: [currentUserId, ...Array.from(friendUserIds)], // Only exclude current user and friends
        },
      },
      select: {
        id: true,
        email: true,
        display_name: true,
        full_name: true, // Include full_name for search
        about: true,
        favorite_genres: true,
        avatar_url: true, // Include avatar_url
        // Add any other profile fields you want to expose
      },
    });

    // Format all profiles with proper avatar URLs and friendship status
    const formattedUsers = await Promise.all(
      explorableUsers.map(async (user) => {
        const formattedUser = await formatProfileWithAvatarUrlServer(supabase!, user);
        
        // Determine friendship status
        let friendshipStatus: 'NOT_FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS' = 'NOT_FRIENDS';
        let pendingRequestId: string | null = null;

        if (sentRequestsMap.has(user.id)) {
          friendshipStatus = 'PENDING_SENT';
          pendingRequestId = sentRequestsMap.get(user.id) || null;
        } else if (receivedRequestsMap.has(user.id)) {
          friendshipStatus = 'PENDING_RECEIVED';
          pendingRequestId = receivedRequestsMap.get(user.id) || null;
        }

        return {
          ...formattedUser,
          friendshipStatus,
          pendingRequestId,
        };
      })
    );

    return NextResponse.json(formattedUsers, { status: 200 });

  } catch (error: any) {
    // console.error("Error fetching explorable users:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch explorable users" }, { status: 500 });
  }
}