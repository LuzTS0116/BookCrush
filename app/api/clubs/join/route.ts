// /app/api/clubs/join/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma'
import { ClubMembershipStatus, ClubRole } from '@/lib/generated/prisma';

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { clubId, status = 'PENDING' } = await req.json(); // Default to PENDING for application

    if (!clubId) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if already a member or pending
    const existingMembership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user.id,
          club_id: clubId,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === ClubMembershipStatus.ACTIVE) {
        return NextResponse.json({ error: "Already an active member of this club" }, { status: 409 });
      }
      if (existingMembership.status === ClubMembershipStatus.PENDING) {
        return NextResponse.json({ error: "Already have a pending application/invitation for this club" }, { status: 409 });
      }
      // If status is LEFT/REJECTED/SUSPENDED, allow to re-apply/re-join (or update status)
      // This logic depends on your business rules. For now, we'll upsert below.
    }

    // --- ATOMIC TRANSACTION for creating/updating membership ---
    const membership = await prisma.$transaction(async (tx) => {
      const newMembership = await tx.clubMembership.upsert({
        where: {
        user_id_club_id: {
          user_id: user.id,
          club_id: clubId,
        },
        },
        update: {
          status: status as ClubMembershipStatus, // Allow status to be set if re-joining
          role: ClubRole.MEMBER, // Reset role if re-joining
          joined_at: new Date(),
        },
        create: {
          user_id: user.id,
          club_id: clubId,
          status: status as ClubMembershipStatus,
          role: ClubRole.MEMBER,
        },
      });

      // Optional: Update club member count (eventual consistency)
      // If you added 'memberCount Int @default(0)' to Club model:
      if (newMembership.status === ClubMembershipStatus.ACTIVE && !existingMembership) { // Only increment if new active member
        await tx.club.update({
          where: { id: clubId },
          data: { memberCount: { increment: 1 } },
        });
      }

      return newMembership;
    });

    return NextResponse.json(membership, { status: 201 });

  } catch (error: any) {
    console.error("Error managing club membership:", error);
    return NextResponse.json({ error: error.message || "Failed to join/apply for club" }, { status: 500 });
  }
}