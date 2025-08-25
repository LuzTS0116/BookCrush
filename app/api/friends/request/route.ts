import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ActivityType, ActivityTargetEntityType  } from '@prisma/client';
import {  FriendRequestStatus  } from '@prisma/client'; // Import Prisma enum
import { checkRateLimit, logSecurityEvent } from '@/lib/security-utils';
import { prisma } from '@/lib/prisma';
import { createServerClientWithToken } from '@/lib/supabaseClient';




export async function POST(req: NextRequest) {
  let user: any = null; // Declare user variable in broader scope
  
  try {
    //use bearer token isntead of cookies
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

    

    // Rate limiting check
    const rateLimitCheck = checkRateLimit(user.id, 'friend_request');
    if (!rateLimitCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', user.id, { 
        operation: 'friend_request',
        endpoint: '/api/friends/request' 
      }, req);
      return NextResponse.json({ error: rateLimitCheck.error }, { status: 429 });
    }

    const { receiverId } = await req.json();

    // Input validation
    if (!receiverId || typeof receiverId !== 'string') {
      return NextResponse.json({ error: "Valid receiver ID is required" }, { status: 400 });
    }

    if (user.id === receiverId) {
      logSecurityEvent('SELF_FRIEND_REQUEST', user.id, {
        endpoint: '/api/friends/request'
      }, req);
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
    }

    // Check if receiver exists
    const receiverExists = await prisma.profile.findUnique({
      where: { id: receiverId },
      select: { id: true }
    });

    if (!receiverExists) {
      logSecurityEvent('INVALID_RECEIVER', user.id, {
        receiverId,
        endpoint: '/api/friends/request'
      }, req);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for spam behavior - count recent friend requests
    const recentRequestsCount = await prisma.friendRequest.count({
      where: {
        senderId: user.id,
        sentAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    const DAILY_FRIEND_REQUEST_LIMIT = 20;
    if (recentRequestsCount >= DAILY_FRIEND_REQUEST_LIMIT) {
      logSecurityEvent('FRIEND_REQUEST_SPAM', user.id, {
        recentRequestsCount,
        limit: DAILY_FRIEND_REQUEST_LIMIT,
        endpoint: '/api/friends/request'
      }, req);
      return NextResponse.json({ 
        error: "Daily friend request limit exceeded. Please try again tomorrow." 
      }, { status: 429 });
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
      logSecurityEvent('DUPLICATE_FRIEND_REQUEST', user.id, {
        receiverId,
        endpoint: '/api/friends/request'
      }, req);
      return NextResponse.json({ error: "Request already exists" }, { status: 409 });
    }
    
    if (existingRelationship[1]) {
      logSecurityEvent('ALREADY_FRIENDS', user.id, {
        receiverId,
        endpoint: '/api/friends/request'
      }, req);
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: user.id,
        receiverId: receiverId,
        status: FriendRequestStatus.PENDING,
      },
    });
    
    // Create ActivityLog Entry for SENT_FRIEND_REQUEST
    // await prisma.activityLog.create({
    //   data: {
    //     user_id: user.id, // The user who sent the request
    //     activity_type: ActivityType.SENT_FRIEND_REQUEST,
    //     target_entity_type: ActivityTargetEntityType.PROFILE, // Target is the receiver's profile
    //     target_entity_id: receiverId, 
    //     related_user_id: receiverId, // The user to whom the request was sent
    //     details: {
    //       sender_id: user.id,
    //       receiver_id: receiverId
    //     }
    //   }
    // });

    // Log successful friend request
    logSecurityEvent('FRIEND_REQUEST_SENT', user.id, {
      receiverId,
      requestId: friendRequest.id
    }, req);

    return NextResponse.json(friendRequest, { status: 201 });

  } catch (error: any) {
    console.error("Error sending friend request:", error);
    
    // Log security event for failed friend request
    logSecurityEvent('FRIEND_REQUEST_FAILED', user?.id || 'unknown', {
      error: error.message,
      endpoint: '/api/friends/request'
    }, req);
    
    return NextResponse.json({ error: error.message || "Failed to send request" }, { status: 500 });
  } finally {
    
  }
}