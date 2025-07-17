import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/prisma';
import { FriendRequestStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { requestId, targetUserId } = await req.json();

    if (!requestId && !targetUserId) {
      return NextResponse.json({ error: "Request ID or target user ID is required" }, { status: 400 });
    }

    let request;

    if (requestId) {
      // Find by specific request ID
      request = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });
    } else if (targetUserId) {
      // Find pending request sent by current user to target user
      request = await prisma.friendRequest.findFirst({
        where: {
          senderId: user.id,
          receiverId: targetUserId,
          status: FriendRequestStatus.PENDING
        },
      });
    }

    if (!request) {
      return NextResponse.json({ error: "Friend request not found." }, { status: 404 });
    }
    
    if (request.senderId !== user.id) {
      return NextResponse.json({ error: "You are not authorized to cancel this request." }, { status: 403 });
    }
    
    if (request.status !== FriendRequestStatus.PENDING) {
      return NextResponse.json({ error: "Request is not pending or already handled." }, { status: 409 });
    }

    // Delete the friend request instead of updating status
    await prisma.friendRequest.delete({
      where: { id: request.id },
    });

    return NextResponse.json({ message: "Friend request cancelled successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Error cancelling friend request:", error);
    return NextResponse.json({ error: error.message || "Failed to cancel request" }, { status: 500 });
  }
} 