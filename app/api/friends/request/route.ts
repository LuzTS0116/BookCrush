import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient, ActivityType, ActivityTargetEntityType  } from '@prisma/client';
import {  FriendRequestStatus  } from '@prisma/client'; // Import Prisma enum

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 });
    }
    if (user.id === receiverId) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
    }

    // Check for existing pending request (either direction) or existing friendship
    const existingRelationship = await prisma.$transaction([
      prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: user.id, receiverId: receiverId, status: FriendRequestStatus.PENDING },
            { senderId: receiverId, receiverId: user.id, status: FriendRequestStatus.PENDING },
          ],
        },
      }),
      prisma.friendship.findFirst({
        where: {
          OR: [
            { userId1: user.id, userId2: receiverId },
            { userId1: receiverId, userId2: user.id },
          ],
        },
      }),
    ]);

    if (existingRelationship[0]) {
      return NextResponse.json({ error: "Pending request already exists" }, { status: 409 });
    }
    if (existingRelationship[1]) {
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: user.id,
        receiverId: receiverId,
        status: FriendRequestStatus.PENDING,
      },
    });
    
    // --- Create ActivityLog Entry for SENT_FRIEND_REQUEST ---
    await prisma.activityLog.create({
      data: {
        user_id: user.id, // The user who sent the request
        activity_type: ActivityType.SENT_FRIEND_REQUEST,
        target_entity_type: ActivityTargetEntityType.PROFILE, // Target is the receiver's profile
        target_entity_id: receiverId, 
        related_user_id: receiverId, // The user to whom the request was sent
        details: {
          sender_id: user.id,
          receiver_id: receiverId
        }
      }
    });
    // --- End ActivityLog Entry ---

    return NextResponse.json(friendRequest, { status: 201 });

  } catch (error: any) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: error.message || "Failed to send request" }, { status: 500 });
  }
}