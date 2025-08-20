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
    
    // 1. Get IDs of existing friends and the current user
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: currentUserId }, // !!! IMPORTANT: Use your actual column names from schema.prisma (e.g., userId1, userAId)
          { userId2: currentUserId }, // !!! IMPORTANT: Use your actual column names from schema.prisma (e.g., userId2, userBId)
        ],
      },
      select: {
        userId1: true,
        userId2: true,
      },
    });

    const connectedUserIds = new Set<string>();
    friendships.forEach(f => {
      connectedUserIds.add(f.userId1);
      connectedUserIds.add(f.userId2);
    });
    connectedUserIds.add(currentUserId); // Always exclude the current user from explore list

    // 2. Get IDs of users with pending friend requests (sent by or received by current user)
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: currentUserId, status: 'PENDING' },
          { receiverId: currentUserId, status: 'PENDING' },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    friendRequests.forEach(fr => {
      connectedUserIds.add(fr.senderId);
      connectedUserIds.add(fr.receiverId);
    });

    // 3. Fetch all users with their profiles, excluding current user, friends, and pending requests
    const explorableUsers = await prisma.profile.findMany({
      where: {
        id: {
          notIn: Array.from(connectedUserIds), // Exclude based on the collected IDs
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

    // Format all profiles with proper avatar URLs (handles both Google URLs and storage keys)
    const formattedUsers = await Promise.all(
      explorableUsers.map(user => formatProfileWithAvatarUrlServer(supabase!, user))
    );

    return NextResponse.json(formattedUsers, { status: 200 });

  } catch (error: any) {
    // console.error("Error fetching explorable users:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch explorable users" }, { status: 500 });
  }
}