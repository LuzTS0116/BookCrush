// /app/api/clubs/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient, ActivityType, ActivityTargetEntityType } from '@/lib/generated/prisma'
import { ClubRole, ClubMembershipStatus } from '@/lib/generated/prisma'; // Import enums

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { name, description, isPrivate } = await req.json(); // isPrivate maps to is_private in schema

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: "Club name is required and must be a string." }, { status: 400 });
    }

    // --- ATOMIC TRANSACTION for creating Club and Owner's ClubMembership ---
    const newClubWithMembership = await prisma.$transaction(async (tx) => {
      // 1. Create the new Club
      const newClub = await tx.club.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null, // Allow null for description
          owner_id: user.id,
          is_private: isPrivate === true, // Map isPrivate from form to schema field
          memberCount: 1, // Initialize with 1 member (the owner)
        },
      });

      // 2. Create the ClubMembership for the owner
      await tx.clubMembership.create({
        data: {
          user_id: user.id,
          club_id: newClub.id,
          role: ClubRole.OWNER,
          status: ClubMembershipStatus.ACTIVE,
        },
      });

      // --- Create ActivityLog Entry for CREATED_CLUB ---
      await tx.activityLog.create({
        data: {
          user_id: user.id,
          activity_type: ActivityType.CREATED_CLUB,
          target_entity_type: ActivityTargetEntityType.CLUB,
          target_entity_id: newClub.id,
          details: {
            club_name: newClub.name,
            club_description: newClub.description,
          }
        }
      });
      // --- End ActivityLog Entry ---

      return newClub; // Return the newly created club
    });

    return NextResponse.json(newClubWithMembership, { status: 201 }); // 201 Created

  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      // Handle unique constraint error for club name
      return NextResponse.json({ error: "A club with this name already exists. Please choose a different name." }, { status: 409 });
    }
    console.error("Error creating club:", error);
    return NextResponse.json({ error: error.message || "Failed to create club" }, { status: 500 });
  }
}