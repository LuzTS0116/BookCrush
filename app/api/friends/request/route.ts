import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma'
import { FriendRequestStatus } from '@/lib/generated/prisma'; // Import Prisma enum

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

    return NextResponse.json(friendRequest, { status: 201 });

  } catch (error: any) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: error.message || "Failed to send request" }, { status: 500 });
  }
}