import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // No longer directly using cookies here
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Using standard client
import { createClient } from '@supabase/supabase-js'; // Standard Supabase client
import { PrismaClient } from '@/lib/generated/prisma'
import { ClubMembershipStatus, ClubRole } from '@/lib/generated/prisma'; // ClubRole might not be needed here

const prisma = new PrismaClient()

// Initialize Supabase client - credentials should be in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check environment variables for /api/clubs/discover.");
}
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    let user = null;

    // User can be optionally authenticated. If token is present, use it.
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user: authenticatedUser }, error: userError } = await supabase.auth.getUser(token);
      if (userError) {
        console.warn("Token validation error for discover clubs (user might be unauthenticated or token invalid):", userError.message);
        // Don't fail the request, just proceed as unauthenticated
      }
      user = authenticatedUser;
    }

    // 1. Fetch all clubs
    const allClubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        owner_id: true,
        memberCount: true,
      },
      orderBy: { // Optional: add some ordering
        memberCount: 'desc'
      }
    });

    if (!user) {
      // If no user is authenticated (or token was invalid), return all clubs with null membershipStatus
      const publicClubs = allClubs.map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        ownerId: club.owner_id,
        memberCount: club.memberCount,
        membershipStatus: null, 
      }));
      return NextResponse.json(publicClubs, { status: 200 });
    }

    // If user is authenticated, proceed to filter based on their memberships
    const userMemberships = await prisma.clubMembership.findMany({
      where: {
        user_id: user.id,
      },
      select: {
        club_id: true,
        status: true,
      },
    });

    const userClubMembershipMap = new Map(
      userMemberships.map(m => [m.club_id, m.status])
    );

  
    const discoverableClubs = allClubs.filter(club => {
      const status = userClubMembershipMap.get(club.id);
      
     
      return status !== ClubMembershipStatus.ACTIVE;
    });

    const clubsForDiscovery = discoverableClubs.map(club => {
        const userStatus = userClubMembershipMap.get(club.id);
        return {
            id: club.id,
            name: club.name,
            description: club.description,
            ownerId: club.owner_id,
            memberCount: club.memberCount,
            membershipStatus: userStatus || null,
        };
    });

    return NextResponse.json(clubsForDiscovery, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching discoverable clubs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch discoverable clubs" }, { status: 500 });
  }
}