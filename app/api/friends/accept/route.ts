import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient, ActivityType, ActivityTargetEntityType  } from '@prisma/client';
import {  FriendRequestStatus  } from '@prisma/client';
import { prisma } from '@/lib/prisma';



export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    let originalSenderId: string | null = null;

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error("Friend request not found.");
      }
      if (request.receiverId !== user.id) {
        throw new Error("You are not authorized to accept this request.");
      }
      if (request.status !== FriendRequestStatus.PENDING) {
        throw new Error("Request is not pending.");
      }
      
      originalSenderId = request.senderId; // Capture senderId for activity log

      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: FriendRequestStatus.ACCEPTED },
      });

      // 2. Create friendship records (ensure canonical order for unique constraint)
      const [userId1, userId2] = request.senderId < request.receiverId
        ? [request.senderId, request.receiverId]
        : [request.receiverId, request.senderId];

      const friendship = await tx.friendship.create({
        data: {
          userId1: userId1,
          userId2: userId2,
        },
      });
      
      // --- Create ActivityLog Entry for ACCEPTED_FRIEND_REQUEST ---
      // Logged by the user who accepted the request (the receiver of original request)
      if (originalSenderId) { // Ensure senderId was captured
        await tx.activityLog.create({
          data: {
            user_id: user.id, // User who accepted (current user)
            activity_type: ActivityType.ACCEPTED_FRIEND_REQUEST,
            target_entity_type: ActivityTargetEntityType.PROFILE, // Target is the profile of the original sender
            target_entity_id: originalSenderId,
            related_user_id: originalSenderId, // The user whose request was accepted
            details: {
              accepter_id: user.id,
              original_sender_id: originalSenderId,
              friend_request_id: requestId
            }
          }
        });
      }
      // --- End ActivityLog Entry ---
      return friendship; 
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Error accepting friend request:", error);
    if (error.code === 'P2002') { // Prisma error for unique constraint violation
      return NextResponse.json({ error: "Already friends or pending request exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to accept request" }, { status: 500 });
  }
}