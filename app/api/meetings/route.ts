import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');

    // Get all clubs where user is an active member
    const userClubs = await prisma.clubMembership.findMany({
      where: {
        user_id: session.user.id,
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
    if (startDate && endDate) {
      dateFilter = {
        meeting_date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    // Get all meetings for user's clubs
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
            user_id: session.user.id
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
      orderBy: { meeting_date: 'asc' }
    });

    // Transform data for frontend
    const transformedMeetings = meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      date: meeting.meeting_date,
      duration_minutes: meeting.duration_minutes,
      location: meeting.location,
      meeting_type: meeting.meeting_type,
      status: meeting.status,
      club: meeting.club,
      book: meeting.book,
      creator: meeting.creator,
      attendees_count: meeting._count.attendees,
      user_attendance_status: meeting.attendees[0]?.status || 'NOT_RESPONDED',
      is_creator: meeting.created_by === session.user.id
    }));

    return NextResponse.json({ meetings: transformedMeetings });

  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 