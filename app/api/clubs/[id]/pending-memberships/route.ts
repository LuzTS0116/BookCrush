// /app/api/clubs/[id]/pending-memberships/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma';
import { ClubMembershipStatus, ClubRole } from '@/lib/generated/prisma'; // Ensure ClubRole is imported for potential admin check

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } } // id is the clubId
) {
  try {
    const clubId = params.id;

    if (!clubId) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 1. Find the club to check ownership/admin status
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { owner_id: true } // Only need owner_id for authorization
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // 2. Authorization Check: Only club owner can view pending memberships.
    // If you want to allow ADMINs as well, you'd fetch the user's ClubMembership
    // for this club and check their 'role'.
    if (club.owner_id !== user.id) {
        // Option to check for ADMIN role:
        // const userClubMembership = await prisma.clubMembership.findUnique({
        //     where: {
        //         userId_clubId: {
        //             userId: user.id,
        //             clubId: clubId,
        //         },
        //     },
        //     select: { role: true }
        // });
        // if (!userClubMembership || (userClubMembership.role !== ClubRole.ADMIN && userClubMembership.role !== ClubRole.OWNER)) {
        //     return NextResponse.json({ error: "You are not authorized to view pending memberships for this club." }, { status: 403 });
        // }

        // Current simplified logic: Only owner
        return NextResponse.json({ error: "You are not authorized to view pending memberships for this club." }, { status: 403 });
    }

    // 3. Fetch pending memberships for this club
    const pendingMemberships = await prisma.clubMembership.findMany({
      where: {
        club_id: clubId,
        status: ClubMembershipStatus.PENDING,
      },
      include: {
        user: { // Include user details of the applicant
          select: {
            id: true,
            email: true, // Or 'name', 'username' if your User model has it
            // Add other user fields you need for display (e.g., avatar_url, initials)
            // Assuming your User model has 'name' or a way to get a display name
             // Assuming User model has a 'name' field
          },
        },
      },
    });

    // 4. Format the response to be client-friendly
    const formattedPendingMemberships = pendingMemberships.map(membership => ({
      id: membership.id, // This is the membershipId needed for the approve API
      userId: membership.user.id,
      userName:  membership.user.email, // Fallback to email if no name
      userAvatar: null, // Replace with actual avatar URL from user if available in your User model
      userInitials: ( membership.user.email?.substring(0, 2) || '??').toUpperCase(),
      appliedAt: membership.joined_at.toISOString(), // Convert to ISO string for easier handling
      status: membership.status,
    }));

    return NextResponse.json(formattedPendingMemberships, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching pending club memberships:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch pending memberships" }, { status: 500 });
  }
}