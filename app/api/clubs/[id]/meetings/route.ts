import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';




export async function GET(
  request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clubId = id;

    // Check if user is a member of the club
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: session.user.id,
          club_id: clubId
        }
      }
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Access denied. You must be an active member of this club.' }, { status: 403 });
    }

    // Get upcoming and past meetings
    const now = new Date();
    
    const meetings = await prisma.clubMeeting.findMany({
      where: { club_id: clubId },
      include: {
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
          include: {
            user: {
              select: {
                id: true,
                display_name: true
              }
            }
          }
        },
        _count: {
          select: {
            attendees: true
          }
        }
      },
      orderBy: { meeting_date: 'asc' }
    });

    // Separate upcoming and past meetings
    const upcomingMeetings = meetings.filter(meeting => new Date(meeting.meeting_date) >= now);
    const pastMeetings = meetings.filter(meeting => new Date(meeting.meeting_date) < now);

    return NextResponse.json({
      upcoming: upcomingMeetings,
      past: pastMeetings
    });

  } catch (error) {
    console.error('Error fetching club meetings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    
  }
}

export async function POST(
  request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clubId = id;
    const body = await request.json();

    // Check if user is an admin or owner of the club
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: session.user.id,
          club_id: clubId
        }
      }
    });

    if (!membership || membership.status !== 'ACTIVE' || !['ADMIN', 'OWNER'].includes(membership.role)) {
      return NextResponse.json({ 
        error: 'Access denied. Only club admins and owners can schedule meetings.' 
      }, { status: 403 });
    }

    // Validate required fields
    const { 
      title, 
      description, 
      meeting_date, 
      duration_minutes, 
      location, 
      meeting_mode,
      meeting_type, 
      book_id 
    } = body;

    if (!title || !meeting_date) {
      return NextResponse.json({ 
        error: 'Title and meeting date are required' 
      }, { status: 400 });
    }

    // Validate meeting date is in the future
    const meetingDateTime = new Date(meeting_date);
    if (meetingDateTime <= new Date()) {
      return NextResponse.json({ 
        error: 'Meeting date must be in the future' 
      }, { status: 400 });
    }

    // Create the meeting
    const meeting = await prisma.clubMeeting.create({
      data: {
        club_id: clubId,
        title,
        description,
        meeting_date: meetingDateTime,
        duration_minutes: duration_minutes || 90,
        location,
        meeting_mode: meeting_mode || 'IN_PERSON',
        meeting_type: meeting_type || 'DISCUSSION',
        book_id: book_id || null,
        created_by: session.user.id
      },
      include: {
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
        }
      }
    });

    // Optionally, create attendee records for all active club members
    const activeMembers = await prisma.clubMembership.findMany({
      where: {
        club_id: clubId,
        status: 'ACTIVE'
      },
      select: { user_id: true }
    });

    // Create attendee records for all active members
    await prisma.clubMeetingAttendee.createMany({
      data: activeMembers.map(member => ({
        meeting_id: meeting.id,
        user_id: member.user_id,
        status: 'NOT_RESPONDED'
      }))
    });

    return NextResponse.json(meeting, { status: 201 });

  } catch (error) {
    console.error('Error creating club meeting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    
  }
} 