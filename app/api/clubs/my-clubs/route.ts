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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Fetch all memberships for the current user that are ACTIVE or PENDING
    const userMemberships = await prisma.clubMembership.findMany({
      where: {
        user_id: user.id,
        status: {
          in: [ClubMembershipStatus.ACTIVE],
        },
      },
      include: {
        club: {
          // Include club details
          select: {
            id: true,
            name: true,
            description: true,
            owner_id: true,
            // Include memberCount if you add it to the schema
            memberCount: true,
            // You might also want to fetch current book, next meeting, etc.,
            // but this requires more complex joins or separate queries depending on your data model.
            // For simplicity, I'm just getting basic club details here.
          },
        },
      },
    });

    // Transform the result into a list of clubs with their membership status for the user
    const clubsWithStatus = userMemberships.map(membership => ({
      id: membership.club.id,
      name: membership.club.name,
      description: membership.club.description,
      ownerId: membership.club.owner_id,
      memberCount: membership.club.memberCount, // Include if added to schema
      membershipStatus: membership.status,
      role: membership.role, // User's role in this club
      admin: true ? membership.club.owner_id == user.id : false
      // You can add more club details if included in the select above or fetched separately
    }));

    return NextResponse.json(clubsWithStatus, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching user's clubs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch user's clubs" }, { status: 500 });
  }
}