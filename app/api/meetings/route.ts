import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';




// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for meetings API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(request: NextRequest) {
  console.log('[API meetings] Request received');

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API meetings] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API meetings] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    console.log('[API meetings] User authenticated:', user.id);

    const url = new URL(request.url);
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');
    const nextOnly = url.searchParams.get('next') === 'true'; // New parameter for dashboard
    const limit = url.searchParams.get('limit');

    // Get all clubs where user is an active member
    const userClubs = await prisma.clubMembership.findMany({
      where: {
        user_id: user.id,
        status: 'ACTIVE'
      },
      select: { club_id: true }
    });

    const clubIds = userClubs.map(membership => membership.club_id);

    if (clubIds.length === 0) {
      return NextResponse.json({ meetings: [] });
    }

    // Build where clause for date filtering
    let dateFilter = {};
    if (nextOnly) {
      // For dashboard: only future meetings
      dateFilter = {
        meeting_date: {
          gte: new Date()
        }
      };
    } else if (startDate && endDate) {
      dateFilter = {
        meeting_date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    // Get meetings for user's clubs
    const meetings = await prisma.clubMeeting.findMany({
      where: {
        club_id: { in: clubIds },
        ...dateFilter
      },
      include: {
        club: {
          select: {
            id: true,
            name: true
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            cover_url: true
          }
        },
        creator: {
          select: {
            id: true,
            display_name: true
          }
        },
        attendees: {
          where: {
            user_id: user.id
          },
          select: {
            status: true
          }
        },
        _count: {
          select: {
            attendees: {
              where: {
                status: 'ATTENDING'
              }
            }
          }
        }
      },
      orderBy: { meeting_date: 'asc' },
      take: limit ? parseInt(limit) : nextOnly ? 1 : undefined // Limit results for dashboard
    });

    console.log('[API meetings] Found meetings:', meetings.length);

    // Transform data for frontend
    const transformedMeetings = meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      date: meeting.meeting_date,
      duration_minutes: meeting.duration_minutes,
      location: meeting.location,
      meeting_mode: meeting.meeting_mode,
      meeting_type: meeting.meeting_type,
      status: meeting.status,
      club: meeting.club,
      book: meeting.book,
      creator: meeting.creator,
      attendees_count: meeting._count.attendees,
      user_attendance_status: meeting.attendees[0]?.status || 'NOT_RESPONDED',
      is_creator: meeting.created_by === user.id
    }));

    return NextResponse.json({ meetings: transformedMeetings });

  } catch (error) {
    console.error('[API meetings] Error fetching meetings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    
  }
} 