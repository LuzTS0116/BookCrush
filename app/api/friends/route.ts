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
        result = await prisma.friendship.findMany({
          where: {
            OR: [
              { userId1: user.id },
              { userId2: user.id },
            ],
          },
          // You might want to include the other user's profile here
          include: {
            user_one:  true  ,
            user_two:   true  
            
            // Need to include user models for sender/receiver if you want their profiles
            // Make sure your Prisma client is configured to allow joins across schemas
            // e.g. sender: { include: { profile: true } }
          },
        });
        break;
      case 'sent':
        // Get pending requests sent by current user
        result = await prisma.friendRequest.findMany({
          where: {
            senderId: user.id,
            status: FriendRequestStatus.PENDING,
          },
          include: {
            receiver: {
              select: {
                display_name: true,
                email: true,
              }

            }
            
            
            // Need to include user models for sender/receiver if you want their profiles
            // Make sure your Prisma client is configured to allow joins across schemas
            // e.g. sender: { include: { profile: true } }
          }
        });
        break;
      case 'received':
        // Get pending requests received by current user
        result = await prisma.friendRequest.findMany({
          where: {
            receiverId: user.id,
            status: FriendRequestStatus.PENDING,
          },
          // You might want to include the other user's profile here
          include: {
            sender: true
            
            // Need to include user models for sender/receiver if you want their profiles
            // Make sure your Prisma client is configured to allow joins across schemas
            // e.g. sender: { include: { profile: true } }
          }
        });
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