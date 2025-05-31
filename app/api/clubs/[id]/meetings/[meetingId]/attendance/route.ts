import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; meetingId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clubId = params.id;
    const meetingId = params.meetingId;
    const body = await request.json();
    const { status } = body; // Expected values: 'ATTENDING', 'NOT_ATTENDING', 'MAYBE'

    if (!['ATTENDING', 'NOT_ATTENDING', 'MAYBE'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be ATTENDING, NOT_ATTENDING, or MAYBE' 
      }, { status: 400 });
    }

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
      return NextResponse.json({ 
        error: 'Access denied. You must be an active member of this club.' 
      }, { status: 403 });
    }

    // Verify the meeting exists and belongs to the club
    const meeting = await prisma.clubMeeting.findFirst({
      where: {
        id: meetingId,
        club_id: clubId
      }
    });

    if (!meeting) {
      return NextResponse.json({ 
        error: 'Meeting not found or does not belong to this club' 
      }, { status: 404 });
    }

    // Update or create attendance record
    const attendanceRecord = await prisma.clubMeetingAttendee.upsert({
      where: {
        meeting_id_user_id: {
          meeting_id: meetingId,
          user_id: session.user.id
        }
      },
      update: {
        status: status as any,
        responded_at: new Date()
      },
      create: {
        meeting_id: meetingId,
        user_id: session.user.id,
        status: status as any,
        responded_at: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      attendance: attendanceRecord 
    });

  } catch (error) {
    console.error('Error updating meeting attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 