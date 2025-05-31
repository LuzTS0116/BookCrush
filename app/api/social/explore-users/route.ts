// app/api/social/explore-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma'; // Adjust path if necessary

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

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
            about: true,
            favorite_genres: true,
            // Add any other profile fields you want to expose
          
      },
    });

    // The 'profile: { isNot: null }' should handle filtering out users without profiles,
    // but an explicit filter can be added for robustness if 'profile' is truly optional in User
    


    return NextResponse.json(explorableUsers, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching explorable users:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch explorable users" }, { status: 500 });
  } finally {
    await prisma.$disconnect(); // Ensure Prisma client is disconnected
  }
}