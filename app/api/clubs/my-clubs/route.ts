import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // No longer directly using cookies here
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Using standard client
import { createClient } from '@supabase/supabase-js'; // Standard Supabase client
import { PrismaClient } from '@/lib/generated/prisma'
import { ClubMembershipStatus, ClubRole } from '@/lib/generated/prisma';

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
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error or no user:", userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

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
            current_book: true,
            //select meetings with status scheduled and date in the future
            meetings: {
              where: {
                status: 'SCHEDULED',
                meeting_date: {
                  gt: new Date(),
                },
              },
            },
          },
        },
      },
    });

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
      
    }));

    return NextResponse.json(clubsWithStatus, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching user's clubs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch user's clubs" }, { status: 500 });
  }
}