import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma';
import {  FriendRequestStatus  } from '@prisma/client'; // Import Prisma enum
import { createClient } from '@supabase/supabase-js';
// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check environment variables.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Optimized avatar URL processing function - SYNCHRONOUS, NO ASYNC CALLS
function processAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  
  // If already a full URL (Google avatars, etc.), return as-is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // Convert relative path to public URL synchronously
  if (supabase) {
    const { data } = supabase.storage.from('profiles').getPublicUrl(avatarPath);
    return data.publicUrl;
  }
  
  return null;
}

export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      console.error('[API friends] Supabase client not initialized');
      return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
    }
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API friends] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'friends', 'sent', 'received'

    let result;

    switch (type) {
      case 'friends':
        // Get active friendships
        const friendships = await prisma.friendship.findMany({
          where: {
            OR: [
              { userId1: user.id },
              { userId2: user.id },
            ],
          },
          include: {
            user_one: true,
            user_two: true  
          },
        });

        // Process avatar URLs for friendships
        result = friendships.map(friendship => ({
          ...friendship,
          user_one: {
            ...friendship.user_one,
            avatar_url: processAvatarUrl(friendship.user_one.avatar_url)
          },
          user_two: {
            ...friendship.user_two,
            avatar_url: processAvatarUrl(friendship.user_two.avatar_url)
          }
        }));
        break;

      case 'sent':
        // Get pending requests sent by current user
        const sentRequests = await prisma.friendRequest.findMany({
          where: {
            senderId: user.id,
            status: FriendRequestStatus.PENDING,
          },
          include: {
            receiver: {
              select: {
                id: true,
                display_name: true,
                email: true,
                avatar_url: true,
              }
            }
          }
        });

        // Process avatar URLs for sent requests
        result = sentRequests.map(request => ({
          ...request,
          receiver: {
            ...request.receiver,
            avatar_url: processAvatarUrl(request.receiver.avatar_url)
          }
        }));
        break;

      case 'received':
        // Get pending requests received by current user
        const receivedRequests = await prisma.friendRequest.findMany({
          where: {
            receiverId: user.id,
            status: FriendRequestStatus.PENDING,
          },
          include: {
            sender: true
          }
        });

        // Process avatar URLs for received requests
        result = receivedRequests.map(request => ({
          ...request,
          sender: {
            ...request.sender,
            avatar_url: processAvatarUrl(request.sender.avatar_url)
          }
        }));
        break;

      default:
        return NextResponse.json({ error: "Invalid type parameter. Use 'friends', 'sent', or 'received'." }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching friend data:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch friend data" }, { status: 500 });
  }
}