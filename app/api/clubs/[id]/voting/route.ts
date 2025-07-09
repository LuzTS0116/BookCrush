// /app/api/clubs/[id]/voting/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ClubRole, ClubMembershipStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// POST - Start a new voting cycle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    const { voting_starts_at, voting_ends_at } = await request.json();

    if (!voting_starts_at || !voting_ends_at) {
      return NextResponse.json(
        { error: "Voting start and end times are required" },
        { status: 400 }
      );
    }

    // Validate that end time is after start time
    const startDate = new Date(voting_starts_at);
    const endDate = new Date(voting_ends_at);
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "Voting end time must be after start time" },
        { status: 400 }
      );
    }

    // Check if user has admin permissions for this club
    const userMembership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user.id,
          club_id: id,
        },
      },
      include: {
        club: {
          select: {
            id: true,
            owner_id: true,
            current_book_id: true,
            voting_cycle_active: true,
          }
        }
      }
    });

    if (!userMembership) {
      return NextResponse.json({ error: "You are not a member of this club" }, { status: 403 });
    }

    const isAdmin = userMembership.role === ClubRole.OWNER || userMembership.role === ClubRole.ADMIN;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only club admins and owners can manage voting cycles" },
        { status: 403 }
      );
    }

    // Check if club has a current book (voting should only happen when no current book)
    if (userMembership.club.current_book_id) {
      return NextResponse.json(
        { error: "Cannot start voting cycle while a book is currently selected" },
        { status: 400 }
      );
    }

    // Check if a voting cycle is already active
    if (userMembership.club.voting_cycle_active) {
      return NextResponse.json(
        { error: "A voting cycle is already active for this club" },
        { status: 400 }
      );
    }

    // Start the voting cycle
    const updatedClub = await prisma.club.update({
      where: { id },
      data: {
        voting_cycle_active: true,
        voting_starts_at: startDate,
        voting_ends_at: endDate,
        voting_started_by: user.id,
      },
      select: {
        id: true,
        voting_cycle_active: true,
        voting_starts_at: true,
        voting_ends_at: true,
        voting_started_by: true,
      }
    });

    return NextResponse.json(updatedClub, { status: 200 });

  } catch (error: any) {
    console.error("Error starting voting cycle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start voting cycle" },
      { status: 500 }
    );
  }
}

// DELETE - End the current voting cycle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    // Check if user has admin permissions for this club
    const userMembership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user.id,
          club_id: id,
        },
      },
      include: {
        club: {
          select: {
            id: true,
            owner_id: true,
            voting_cycle_active: true,
          }
        }
      }
    });

    if (!userMembership) {
      return NextResponse.json({ error: "You are not a member of this club" }, { status: 403 });
    }

    const isAdmin = userMembership.role === ClubRole.OWNER || userMembership.role === ClubRole.ADMIN;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only club admins and owners can manage voting cycles" },
        { status: 403 }
      );
    }

    // Check if a voting cycle is currently active
    if (!userMembership.club.voting_cycle_active) {
      return NextResponse.json(
        { error: "No active voting cycle to end" },
        { status: 400 }
      );
    }

    // End the voting cycle
    const updatedClub = await prisma.club.update({
      where: { id },
      data: {
        voting_cycle_active: false,
        voting_starts_at: null,
        voting_ends_at: null,
        voting_started_by: null,
      },
      select: {
        id: true,
        voting_cycle_active: true,
        voting_starts_at: true,
        voting_ends_at: true,
        voting_started_by: true,
      }
    });

    return NextResponse.json(updatedClub, { status: 200 });

  } catch (error: any) {
    console.error("Error ending voting cycle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to end voting cycle" },
      { status: 500 }
    );
  }
} 