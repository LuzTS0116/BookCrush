import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma'
import { FriendRequestStatus } from '@/lib/generated/prisma';

const prisma = new PrismaClient()

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

    // --- ATOMIC TRANSACTION for accepting a request ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find and update the request status
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

      return friendship; // Return the created friendship
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