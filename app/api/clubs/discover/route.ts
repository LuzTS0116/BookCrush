import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma'
import { ClubMembershipStatus, ClubRole } from '@/lib/generated/prisma';

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // If no user is authenticated, return all public clubs without checking membership status
      // You might want to adjust this logic based on whether you allow unauthenticated discovery.
      // For now, it will fetch all clubs and the UI can decide how to render "Join" or "Login to Join".
      // OR, you could return an error requiring authentication for this endpoint.
      return NextResponse.json({ error: "Authentication required to discover clubs based on your membership status." }, { status: 401 });
    }

    // 1. Fetch all clubs
    const allClubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        owner_id: true,
        // Include memberCount if you add it to the schema
        memberCount: true,
      },
    });

    // 2. Fetch all memberships for the current user (any status, including left/rejected, to filter out)
    const userMemberships = await prisma.clubMembership.findMany({
      where: {
        user_id: user.id,
      },
      select: {
        club_id: true,
        status: true,
      },
    });

    // Create a map of club_id to membership status for quick lookup
    const userClubMembershipMap = new Map(
      userMemberships.map(m => [m.club_id, m.status])
    );

    // Filter out clubs where the user is already ACTIVE or PENDING
    const discoverableClubs = allClubs.filter(club => {
      const status = userClubMembershipMap.get(club.id);
      return status !== ClubMembershipStatus.ACTIVE; //&& status !== ClubMembershipStatus.PENDING;
    });

    // You can optionally enrich the discoverable clubs with the user's status (e.g., 'LEFT', 'REJECTED')
    // For now, it just returns clubs the user can apply to.
    const clubsForDiscovery = discoverableClubs.map(club => {
        const userStatus = userClubMembershipMap.get(club.id); // Get user's status if they have any prior membership
        return {
            id: club.id,
            name: club.name,
            description: club.description,
            ownerId: club.owner_id,
            memberCount: club.memberCount,
            membershipStatus: userStatus || null, // Will be null if no prior membership
        };
    });


    return NextResponse.json(clubsForDiscovery, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching discoverable clubs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch discoverable clubs" }, { status: 500 });
  }
}