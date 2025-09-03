import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params;
  
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clubId = id;
    const body = await request.json();

    // Check if the meeting exists and get current meeting data
    const existingMeeting = await prisma.clubMeeting.findUnique({
      where: { 
        id: meetingId,
        club_id: clubId // Ensure meeting belongs to the specified club
      },
      include: {
        club: true
      }
    });

    if (!existingMeeting) {
      return NextResponse.json({ 
        error: 'Meeting not found' 
      }, { status: 404 });
    }

    // Check if user has permission to edit this meeting
    // They can edit if they are:
    // 1. The creator of the meeting, OR
    // 2. An admin/owner of the club
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: session.user.id,
          club_id: clubId
        }
      }
    });

    const isCreator = existingMeeting.created_by === session.user.id;
    const isClubAdmin = membership && membership.status === 'ACTIVE' && ['ADMIN', 'OWNER'].includes(membership.role);

    if (!isCreator && !isClubAdmin) {
      return NextResponse.json({ 
        error: 'Access denied. Only meeting creators and club admins can edit meetings.' 
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

    // Validate meeting date is in the future (only if changing the date)
    const meetingDateTime = new Date(meeting_date);
    if (meetingDateTime <= new Date()) {
      return NextResponse.json({ 
        error: 'Meeting date must be in the future' 
      }, { status: 400 });
    }

    // Validate meeting_mode if provided
    if (meeting_mode && !['IN_PERSON', 'VIRTUAL'].includes(meeting_mode)) {
      return NextResponse.json({ 
        error: 'Invalid meeting mode. Must be IN_PERSON or VIRTUAL' 
      }, { status: 400 });
    }

    // Update the meeting
    const updatedMeeting = await prisma.clubMeeting.update({
      where: { id: meetingId },
      data: {
        title,
        description,
        meeting_date: meetingDateTime,
        duration_minutes: duration_minutes || 90,
        location,
        meeting_mode: meeting_mode || 'IN_PERSON',
        meeting_type: meeting_type || 'DISCUSSION',
        book_id: book_id || null,
        // Don't update created_by or club_id - these should remain unchanged
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
        },
        club: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedMeeting, { status: 200 });

  } catch (error) {
    console.error('Error updating club meeting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params;
  
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clubId = id;

    // Check if the meeting exists and get current meeting data
    const existingMeeting = await prisma.clubMeeting.findUnique({
      where: { 
        id: meetingId,
        club_id: clubId // Ensure meeting belongs to the specified club
      }
    });

    if (!existingMeeting) {
      return NextResponse.json({ 
        error: 'Meeting not found' 
      }, { status: 404 });
    }

    // Check if user has permission to delete this meeting
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: session.user.id,
          club_id: clubId
        }
      }
    });

    const isCreator = existingMeeting.created_by === session.user.id;
    const isClubAdmin = membership && membership.status === 'ACTIVE' && ['ADMIN', 'OWNER'].includes(membership.role);

    if (!isCreator && !isClubAdmin) {
      return NextResponse.json({ 
        error: 'Access denied. Only meeting creators and club admins can delete meetings.' 
      }, { status: 403 });
    }

    // Delete the meeting (this will cascade delete attendee records due to foreign key constraints)
    await prisma.clubMeeting.delete({
      where: { id: meetingId }
    });

    return NextResponse.json({ message: 'Meeting deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting club meeting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 