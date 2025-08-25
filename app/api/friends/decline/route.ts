import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithToken } from '@/lib/supabaseClient';
import { prisma } from '@/lib/prisma';
import { FriendRequestStatus } from '@prisma/client'; // Import Prisma enum



export async function POST(req: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    
    if (!accessToken) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
    }
    
    const supabase = createServerClientWithToken(accessToken);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: "Friend request not found." }, { status: 404 });
    }
    if (request.receiverId !== user.id) {
      return NextResponse.json({ error: "You are not authorized to decline this request." }, { status: 403 });
    }
    if (request.status !== FriendRequestStatus.PENDING) {
      return NextResponse.json({ error: "Request is not pending or already handled." }, { status: 409 });
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: FriendRequestStatus.DECLINED },
    });

    return NextResponse.json(updatedRequest, { status: 200 });

  } catch (error: any) {
    console.error("Error declining friend request:", error);
    return NextResponse.json({ error: error.message || "Failed to decline request" }, { status: 500 });
  }
}