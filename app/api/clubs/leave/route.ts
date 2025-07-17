// /app/api/clubs/leave/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ClubMembershipStatus, ActivityType, ActivityTargetEntityType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { clubId } = await req.json();

    if (!clubId) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    // --- ATOMIC TRANSACTION for leaving club ---
    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.clubMembership.findUnique({
        where: {
          user_id_club_id: {
            user_id: user.id,
            club_id: clubId,
          },
        },
        include: { club: true }
      });

      if (!membership) {
        throw new Error("Membership not found.");
      }

      if (membership.status !== ClubMembershipStatus.ACTIVE) {
        throw new Error("You are not an active member of this club.");
      }

      // Check if user is the owner - owners cannot leave their own club
      if (membership.club.owner_id === user.id) {
        throw new Error("Club owners cannot leave their own club. Please transfer ownership first or delete the club.");
      }

      const updatedMembership = await tx.clubMembership.update({
        where: {
          user_id_club_id: {
            user_id: user.id,
            club_id: clubId,
          },
        },
        data: { status: ClubMembershipStatus.LEFT },
      });

      // Decrement club member count
      await tx.club.update({
        where: { id: clubId },
        data: { memberCount: { decrement: 1 } },
      });

      // Create ActivityLog Entry for LEFT_CLUB
      await tx.activityLog.create({
        data: {
          user_id: user.id,
          activity_type: ActivityType.LEFT_CLUB,
          target_entity_type: ActivityTargetEntityType.CLUB,
          target_entity_id: clubId,
          details: {
            club_id: clubId,
            club_name: membership.club.name,
          }
        }
      });

      return updatedMembership;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Successfully left the club" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error leaving club:", error);
    return NextResponse.json({ error: error.message || "Failed to leave club" }, { status: 500 });
  }
} 