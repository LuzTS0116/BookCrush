import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import {  ClubMembershipStatus, ClubRole  } from '@prisma/client'; // ClubRole might not be needed here
import { processAvatarUrl } from '@/utils/supabase/processAvatar';





export async function GET(req: NextRequest) {
  const supabase = await createClient();

  if (!supabase) {
    console.error('[API my-clubs] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }
  try {
       
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API books POST] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API books POST] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

   

    // Revert to original working query structure but with optimized processing
    const allClubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        owner_id: true,
        memberCount: true,
        genres: true,
        current_book: {
          select: {
            id: true,
            title: true,
            author: true,
            cover_url: true,
            pages: true,
            reading_time: true,
            genres: true,
          }
        },
        // Add memberships for real member avatars
        memberships: {
          where: {
            status: ClubMembershipStatus.ACTIVE,
          },
          select: {
            user_id: true,
            role: true,
            joined_at: true,
            user: {
              select: {
                id: true,
                display_name: true,
                avatar_url: true,
              },
            },
          },
          orderBy: [
            { role: 'desc' }, // Owners and admins first
            { joined_at: 'asc' }, // Then by join date
          ],
        },
      },
      orderBy: { // Optional: add some ordering
        memberCount: 'desc'
      }
    });

    if (!user) {
      // PERFORMANCE FIX: Process all clubs synchronously for unauthenticated users
      const publicClubs = allClubs.map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        ownerId: club.owner_id,
        memberCount: club.memberCount,
        membershipStatus: null,
        genres: club.genres,
        current_book: club.current_book,
        // Include members data for avatars with synchronous processing
        members: club.memberships.map(member => ({
          id: member.user.id,
          display_name: member.user.display_name,
          avatar_url: processAvatarUrl(member.user.avatar_url, supabase), // Synchronous!
          role: member.role,
          joined_at: member.joined_at,
        })),
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

    // PERFORMANCE FIX: Process data synchronously instead of async
    const clubsForDiscovery = discoverableClubs.map(club => {
        const userStatus = userClubMembershipMap.get(club.id);
        return {
            id: club.id,
            name: club.name,
            description: club.description,
            ownerId: club.owner_id,
            memberCount: club.memberCount,
            genres: club.genres,
            current_book: club.current_book,
            membershipStatus: userStatus || null,
            // Include members data for avatars with synchronous processing
            members: club.memberships.map(member => ({
              id: member.user.id,
              display_name: member.user.display_name,
              avatar_url: processAvatarUrl(member.user.avatar_url, supabase), // Synchronous!
              role: member.role,
              joined_at: member.joined_at,
            })),
        };
    });

    return NextResponse.json(clubsForDiscovery, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching discoverable clubs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch discoverable clubs" }, { status: 500 });
  }
}