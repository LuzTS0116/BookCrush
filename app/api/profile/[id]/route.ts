import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPublicProfileData } from '@/lib/friendship-utils';
import { canViewProfile } from '@/lib/friendship-utils';
import { formatProfileWithAvatarUrlServer } from '@/lib/supabase-server-utils';
import { prisma } from '@/lib/prisma';

// Initialize Supabase client - credentials should be in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check environment variables.");
  // You might want to throw an error here or handle it gracefully depending on your app's startup requirements
}

// Create a single Supabase client instance
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;



export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    console.error('[API profile/[id]] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API profile/[id] Missing or invalid Authorization header:', authHeader?.substring(0, 20));
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    // 2. Get the profile ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    // 3. Check if the requesting user can view the profile
    const canView = await canViewProfile(prisma, user.id, id);
    
    // Check friendship and friend request status
    let friendshipStatus: 'NOT_FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS' = 'NOT_FRIENDS';
    
    if (user.id !== id) { // Don't check friendship status for own profile
      if (canView) {
        friendshipStatus = 'FRIENDS';
      } else {
        // Check for pending friend requests
        const pendingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: id, status: 'PENDING' },
              { senderId: id, receiverId: user.id, status: 'PENDING' }
            ]
          }
        });
        
        if (pendingRequest) {
          friendshipStatus = pendingRequest.senderId === user.id ? 'PENDING_SENT' : 'PENDING_RECEIVED';
        }
      }
    }

    // If users are friends, return full profile data
    if (canView || user.id === id) {
      const profile = await prisma.profile.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          display_name: true,
          full_name: true,
          avatar_url: true,
          about: true,
          favorite_genres: true,
          userBooks: {
            include: {
              book: true // Include the full book details
            }
          },
          addedBooks: true,
          //how many memberships
          _count: {
            select: {
              memberships: {
                where: { status: 'ACTIVE' }
              },
              friendshipsAsUser1: true,
              friendshipsAsUser2: true,
            }
          }
          // Don't include sensitive information like email or kindle_email
          // Only include what should be publicly visible
        },
      });

      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      // Format the profile with proper avatar URL
      const formattedProfile = await formatProfileWithAvatarUrlServer(supabase!, profile);
      return NextResponse.json({ 
        ...formattedProfile, 
        isFriend: true, 
        friendshipStatus 
      }, { status: 200 });
    } else {
      // If users are not friends, return only basic information
      const profile = await prisma.profile.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          display_name: true,
          
          avatar_url: true,
          about: true,
          favorite_genres: true,
          _count: {
            select: {
              memberships: {
                where: { status: 'ACTIVE' }
              },
              friendshipsAsUser1: true,
              friendshipsAsUser2: true,
            }
          }
        },
      });

      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      // Format the profile with proper avatar URL
      const formattedProfile = await formatProfileWithAvatarUrlServer(supabase!, profile);
      return NextResponse.json({ 
        ...formattedProfile, 
        isFriend: false, 
        friendshipStatus 
      }, { status: 200 });
    }



  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  } finally {
    
  }
}