// /app/api/clubs/[id]/pending-memberships/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // No longer directly using cookies here
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Using standard client
import { createClient } from '@supabase/supabase-js'; // Standard Supabase client
import { PrismaClient } from '@prisma/client';
import {  ClubMembershipStatus, ClubRole  } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for /api/clubs/[id]/pending-memberships.");
}
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(
  request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {

   const {id} = await params; 
  

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }
  
  try {
    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error or no user for pending memberships:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    // 1. Find the club to check ownership/admin status
    const club = await prisma.club.findUnique({
      where: { id: id },
      select: { owner_id: true } 
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // 2. Authorization Check: Only club owner OR ADMIN can view pending memberships.
    let isAuthorized = club.owner_id === user.id;
    if (!isAuthorized) {
        const userClubMembership = await prisma.clubMembership.findUnique({
            where: {
                user_id_club_id: {
                    user_id: user.id,
                    club_id: id,
                },
            },
            select: { role: true }
        });
        if (userClubMembership && userClubMembership.role === ClubRole.ADMIN) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        return NextResponse.json({ error: "You are not authorized to view pending memberships for this club." }, { status: 403 });
    }

    // 3. Fetch pending memberships for this club
    const pendingMemberships = await prisma.clubMembership.findMany({
      where: {
        club_id: id,
        status: ClubMembershipStatus.PENDING,
      },
      include: {
        user: { 
          select: {
            id: true,
            email: true,
            display_name: true, // Cannot determine path from current info
            avatar_url: true,   // Cannot determine path from current info
          },
        },
      },
    });

    // 4. Format the response
    const formattedPendingMemberships = pendingMemberships.map(membership => {
      // Safely access user and its properties, defaulting if parts are missing
      const userId = membership.user?.id;
      const userName = membership.user?.display_name || 'N/A'; // Fallback to email or N/A
      const userAvatar = membership.user?.avatar_url || null; // Cannot determine path from current info
      const userInitials = (userName?.substring(0, 2) || '??').toUpperCase();

      if (!userId) {
        // This case should ideally not happen if the include worked and user relation is mandatory
        console.warn('Pending membership found without a valid user ID:', membership.id);
        return null; // Or some default error structure
      }

      return {
        id: membership.id,
        userId: userId, 
        userName: userName, 
        userAvatar: userAvatar, 
        userInitials: userInitials,
        appliedAt: membership.joined_at.toISOString(),
        status: membership.status,
      };
    }).filter(Boolean); // Filter out any nulls if memberships without user were returned

    return NextResponse.json(formattedPendingMemberships, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching pending club memberships:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch pending memberships" }, { status: 500 });
  }
}