import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // No longer directly using cookies here
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Using standard client
import { createClient } from '@supabase/supabase-js'; // Standard Supabase client
import { PrismaClient } from '@prisma/client'
import {  ClubMembershipStatus, ClubRole  } from '@prisma/client';

const prisma = new PrismaClient()

// Initialize Supabase client - credentials should be in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check environment variables.");
  // You might want to throw an error here or handle it gracefully depending on your app's startup requirements
}

// Create a single Supabase client instance
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(req: NextRequest) {
  console.log('[API my-clubs] Request received:', {
    method: req.method,
    url: req.url,
    headers: {
      authorization: req.headers.get('Authorization')?.substring(0, 30) + '...',
      contentType: req.headers.get('Content-Type'),
      userAgent: req.headers.get('User-Agent')?.substring(0, 50) + '...',
    }
  });

  if (!supabase) {
    console.error('[API my-clubs] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API my-clubs] Missing or invalid Authorization header:', authHeader?.substring(0, 20));
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    console.log('[API my-clubs] Token extracted:', { tokenLength: token?.length || 0, tokenPrefix: token?.substring(0, 20) + '...' });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    console.log('[API my-clubs] Supabase auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message
    });

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    console.log('[API my-clubs] User authenticated successfully, fetching clubs...');

    // Fetch all memberships for the current user that are ACTIVE
    const userMemberships = await prisma.clubMembership.findMany({
      where: {
        user_id: user.id,
        status: {
          in: [ClubMembershipStatus.ACTIVE],
        },
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            description: true,
            owner_id: true,
            memberCount: true,
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
            meetings: { where: { meeting_date: { gt: new Date() } },
              select: {
                id: true,
                meeting_date: true
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
                    nickname: true,
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
        },
      },
    });

    console.log('[API my-clubs] Database query completed:', { membershipCount: userMemberships.length });

    //get the a single meeting with status scheduled from userMemberships.club.meetings
    // const nextMeeting = userMemberships.map(membership => membership.club.meetings.find(meeting => meeting.status === 'SCHEDULED'));

    const clubsWithStatus = userMemberships.map(membership => ({
      id: membership.club.id,
      name: membership.club.name,
      description: membership.club.description,
      ownerId: membership.club.owner_id,
      memberCount: membership.club.memberCount,
      membershipStatus: membership.status,
      role: membership.role,
      // Corrected admin check
      admin: membership.club.owner_id === user.id,
      current_book: membership.club.current_book,
      meetings: membership.club.meetings,
      // Include members data for avatars
      members: membership.club.memberships.map(member => ({
        id: member.user.id,
        display_name: member.user.display_name,
        nickname: member.user.nickname,
        avatar_url: member.user.avatar_url,
        role: member.role,
        joined_at: member.joined_at,
      })),
    }));

    console.log('[API my-clubs] Returning response:', { clubCount: clubsWithStatus.length });
    return NextResponse.json(clubsWithStatus, { status: 200 });

  } catch (error: any) {
    console.error("[API my-clubs] Error fetching user's clubs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch user's clubs" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}