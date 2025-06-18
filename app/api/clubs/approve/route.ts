// Similar structure to friends/accept, but for club membership applications
// This would typically be called by an admin or owner.
// /app/api/clubs/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@prisma/client'
import {  ClubMembershipStatus, ClubRole, ActivityType, ActivityTargetEntityType  } from '@prisma/client';


const prisma = new PrismaClient()
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { membershipId } = await req.json(); // ID of the specific ClubMembership record

    if (!membershipId) {
      return NextResponse.json({ error: "Membership ID is required" }, { status: 400 });
    }

    // --- ATOMIC TRANSACTION for approving membership ---
    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.clubMembership.findUnique({
        where: { id: membershipId },
        include: { club: true } // Include club to check owner
      });

      if (!membership) {
        throw new Error("Membership request not found.");
      }

      // Authorization: Only club owner/admin can approve
      // Assuming 'user.id' is the authenticated user's ID
      // You'll need to check if the current user is an admin or owner of `membership.clubId`
      // For simplicity, let's assume `user.id` must be the club owner for now:
      if (membership.club.owner_id !== user.id) {
        // Or check `await tx.clubMembership.findUnique({ where: { userId_clubId: { userId: user.id, clubId: membership.clubId }, role: 'ADMIN' } })`
        throw new Error("You are not authorized to approve this membership.");
      }

      if (membership.status !== ClubMembershipStatus.PENDING) {
        throw new Error("Membership is not pending.");
      }

      const updatedMembership = await tx.clubMembership.update({
        where: { id: membershipId },
        data: { status: ClubMembershipStatus.ACTIVE },
      });

      // Optional: Increment club member count (eventual consistency)
      if (updatedMembership.status === ClubMembershipStatus.ACTIVE) {
        await tx.club.update({
          where: { id: membership.club_id },
          data: { memberCount: { increment: 1 } },
        });

        // --- Create ActivityLog Entry for JOINED_CLUB ---
        await tx.activityLog.create({
          data: {
            user_id: updatedMembership.user_id, // The user who joined
            activity_type: ActivityType.JOINED_CLUB,
            target_entity_type: ActivityTargetEntityType.CLUB,
            target_entity_id: membership.club_id,
            details: {
              club_id: membership.club_id,
              club_name: membership.club.name, // Assuming club name is available
              approved_by_user_id: user.id // The admin/owner who approved
            }
          }
        });
        // --- End ActivityLog Entry ---
        
        // --- Create ActivityLog Entries for CLUB_NEW_MEMBER for other active members ---
        const newMemberUser = await tx.profile.findUnique({
          where: { id: updatedMembership.user_id },
          select: { display_name: true }
        });

        if (newMemberUser) {
          const otherActiveMembers = await tx.clubMembership.findMany({
            where: {
              club_id: membership.club_id,
              status: ClubMembershipStatus.ACTIVE,
              user_id: {
                not: updatedMembership.user_id // Exclude the new member themselves
              }
            },
            select: { user_id: true }
          });

          const clubNewMemberActivityPromises = otherActiveMembers.map(activeMember =>
            tx.activityLog.create({
              data: {
                user_id: activeMember.user_id, // The existing member receiving the notification
                activity_type: ActivityType.CLUB_NEW_MEMBER, // Ensure this enum exists
                target_entity_type: ActivityTargetEntityType.CLUB,
                target_entity_id: membership.club_id,
                related_user_id: updatedMembership.user_id, // ID of the new member
                details: {
                  club_id: membership.club_id,
                  club_name: membership.club.name,
                  new_member_id: updatedMembership.user_id,
                  new_member_name: newMemberUser.display_name || 'A new member'
                }
              }
            })
          );
          await Promise.all(clubNewMemberActivityPromises);
        }
        // --- End CLUB_NEW_MEMBER ActivityLog Entries ---
      }

      return updatedMembership;
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Error approving club membership:", error);
    return NextResponse.json({ error: error.message || "Failed to approve membership" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}