import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function PATCH(
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
    const { 
      attendanceData, // Array of { userId, actuallyAttended }
      meetingNotes, // Notes from the meeting
      bookRating, // Rating for book (if DISCUSSION meeting)
      bookNotes, // Discussion notes for book (if DISCUSSION meeting)
      bookStatus // Status: 'COMPLETED' or 'ABANDONED' (if DISCUSSION meeting)
    } = body;

    // Validate that attendanceData is provided and is an array
    if (!attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json({ 
        error: 'Invalid attendance data. Expected array of attendance records.' 
      }, { status: 400 });
    }

    // Check if the meeting exists and get current meeting data
    const existingMeeting = await prisma.clubMeeting.findUnique({
      where: { 
        id: meetingId,
        club_id: clubId
      },
      include: {
        club: {
          include: {
            current_book: true
          }
        },
        book: true,
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                display_name: true,
                avatar_url: true
              }
            }
          }
        }
      }
    });

    if (!existingMeeting) {
      return NextResponse.json({ 
        error: 'Meeting not found' 
      }, { status: 404 });
    }

    // Check if user has permission to complete this meeting
    // Only club admins/owners can complete meetings
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: session.user.id,
          club_id: clubId
        }
      }
    });

    if (!membership || !['ADMIN', 'OWNER'].includes(membership.role)) {
      return NextResponse.json({ 
        error: 'Only club administrators can complete meetings' 
      }, { status: 403 });
    }

    // Check if meeting is already completed
    if (existingMeeting.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Meeting is already completed' 
      }, { status: 400 });
    }

    // Validate attendance data - ensure all attendees are valid members
    const attendeeUserIds = existingMeeting.attendees.map(a => a.user_id);
    const providedUserIds = attendanceData.map(a => a.userId);
    
    for (const attendanceRecord of attendanceData) {
      if (!attendeeUserIds.includes(attendanceRecord.userId)) {
        return NextResponse.json({ 
          error: `User ${attendanceRecord.userId} is not registered for this meeting` 
        }, { status: 400 });
      }
      
      if (typeof attendanceRecord.actuallyAttended !== 'boolean') {
        return NextResponse.json({ 
          error: 'actuallyAttended must be a boolean value' 
        }, { status: 400 });
      }
    }

    // Update meeting status and attendance records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update meeting status to COMPLETED
      const updatedMeeting = await tx.clubMeeting.update({
        where: { id: meetingId },
        data: {
          status: 'COMPLETED',
          meeting_notes: meetingNotes || null,
          completed_at: new Date(),
          updated_at: new Date()
        }
      });

      // Update attendance records
      const attendanceUpdates = [];
      for (const attendanceRecord of attendanceData) {
        const updatedAttendee = await tx.clubMeetingAttendee.update({
          where: {
            meeting_id_user_id: {
              meeting_id: meetingId,
              user_id: attendanceRecord.userId
            }
          },
          data: {
            actually_attended: attendanceRecord.actuallyAttended,
            marked_at: new Date()
          }
        });
        attendanceUpdates.push(updatedAttendee);
      }

      // Handle book completion for DISCUSSION meetings
      let bookCompletion = null;
      if (existingMeeting.meeting_type === 'DISCUSSION' && existingMeeting.club.current_book && bookStatus) {
        // Check if this meeting is about the current book
        if (existingMeeting.book_id === existingMeeting.club.current_book.id) {
          // Create a club book entry to track completion
          const clubBook = await tx.clubBook.create({
            data: {
              club_id: clubId,
              book_id: existingMeeting.club.current_book.id,
              started_at: new Date(), // Could be improved to track actual start date
              finished_at: bookStatus === 'COMPLETED' ? new Date() : null,
              status: bookStatus as 'COMPLETED' | 'ABANDONED',
              rating: bookRating ? parseInt(bookRating) : null,
              discussion_notes: bookNotes || null,
            }
          });

          // Clear the current book from the club if completed or abandoned
          await tx.club.update({
            where: { id: clubId },
            data: { current_book_id: null }
          });

          bookCompletion = clubBook;
        }
      }

      return {
        meeting: updatedMeeting,
        attendanceUpdates,
        bookCompletion
      };
    });

    // Calculate attendance summary
    const totalAttendees = attendanceData.length;
    const actualAttendees = attendanceData.filter(a => a.actuallyAttended).length;
    const noShows = totalAttendees - actualAttendees;

    // Create success message based on meeting type and actions taken
    let message = `Meeting completed successfully. ${actualAttendees} out of ${totalAttendees} members attended.`;
    
    if (result.bookCompletion) {
      const bookTitle = existingMeeting.club.current_book?.title || 'the book';
      if (bookStatus === 'COMPLETED') {
        message += ` "${bookTitle}" has been marked as completed and moved to history.`;
      } else if (bookStatus === 'ABANDONED') {
        message += ` "${bookTitle}" has been marked as not completed and moved to history.`;
      }
    }

    return NextResponse.json({
      success: true,
      meeting: result.meeting,
      bookCompletion: result.bookCompletion,
      attendanceSummary: {
        totalRegistered: totalAttendees,
        actuallyAttended: actualAttendees,
        noShows: noShows,
        attendanceRate: totalAttendees > 0 ? Math.round((actualAttendees / totalAttendees) * 100) : 0
      },
      message
    });

  } catch (error) {
    console.error('Error completing meeting:', error);
    return NextResponse.json(
      { error: 'Failed to complete meeting' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch meeting completion data (for the dialog)
export async function GET(
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

    // Check if user has permission
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: session.user.id,
          club_id: clubId
        }
      }
    });

    if (!membership || !['ADMIN', 'OWNER'].includes(membership.role)) {
      return NextResponse.json({ 
        error: 'Only club administrators can access meeting completion data' 
      }, { status: 403 });
    }

    // Get meeting with attendees
    const meeting = await prisma.clubMeeting.findUnique({
      where: { 
        id: meetingId,
        club_id: clubId
      },
      include: {
        club: {
          include: {
            current_book: {
              select: {
                id: true,
                title: true,
                author: true,
                cover_url: true
              }
            }
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                display_name: true,
                avatar_url: true
              }
            }
          },
          orderBy: {
            user: {
              display_name: 'asc'
            }
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            cover_url: true
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ 
        error: 'Meeting not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      meeting: {
        id: meeting.id,
        title: meeting.title,
        meeting_date: meeting.meeting_date,
        location: meeting.location,
        meeting_type: meeting.meeting_type,
        status: meeting.status,
        book: meeting.book,
        current_book: meeting.club.current_book
      },
      attendees: meeting.attendees.map(attendee => ({
        id: attendee.id,
        userId: attendee.user_id,
        user: attendee.user,
        rsvpStatus: attendee.status,
        respondedAt: attendee.responded_at,
        actuallyAttended: attendee.actually_attended,
        markedAt: attendee.marked_at
      }))
    });

  } catch (error) {
    console.error('Error fetching meeting completion data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting data' },
      { status: 500 }
    );
  }
} 