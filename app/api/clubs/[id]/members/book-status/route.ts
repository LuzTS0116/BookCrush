import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/prisma';

// GET /api/clubs/[id]/members/book-status - Get book shelf status for all members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the club and its current book
    const club = await prisma.club.findUnique({
      where: { id },
      select: {
        id: true,
        current_book_id: true,
        memberships: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            user_id: true,
            role: true,
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

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (!club.current_book_id) {
      return NextResponse.json({ memberStatuses: [] }, { status: 200 });
    }

    // Get all member user IDs
    const memberUserIds = club.memberships.map(m => m.user_id);

    // Get book shelf status for all members
    const userBookStatuses = await prisma.userBook.findMany({
      where: {
        user_id: { in: memberUserIds },
        book_id: club.current_book_id
      },
      select: {
        user_id: true,
        shelf: true,
        status: true,
        added_at: true
      }
    });

    // Create a map of user book statuses
    const statusMap = new Map();
    userBookStatuses.forEach(status => {
      statusMap.set(status.user_id, {
        shelf: status.shelf,
        status: status.status,
        added_at: status.added_at
      });
    });

    // Build response with member info and their book status
    const memberStatuses = club.memberships.map(membership => {
      const bookStatus = statusMap.get(membership.user_id);
      
      let status = 'Not in Library';
      if (bookStatus) {
        // Check shelf type first
        if (bookStatus.shelf === 'currently_reading') {
          status = 'Currently Reading';
        } else if (bookStatus.shelf === 'queue') {
          status = 'Reading Queue';
        } else if (bookStatus.shelf === 'history') {
          // Check reading status for more specific history status
          if (bookStatus.status === 'finished') {
            status = 'Completed';
          } else if (bookStatus.status === 'unfinished') {
            status = 'Did Not Finish';
          } else {
            status = 'Previously Read';
          }
        } else if (bookStatus.shelf === 'favorite') {
          status = 'Favorited';
        } else {
          // Fallback to status if shelf type doesn't match expected values
          if (bookStatus.status === 'finished') {
            status = 'Completed';
          } else if (bookStatus.status === 'in_progress') {
            status = 'Reading';
          } else if (bookStatus.status === 'almost_done') {
            status = 'Almost Done';
          } else {
            status = 'In Library';
          }
        }
      }

      return {
        user_id: membership.user_id,
        user: membership.user,
        role: membership.role,
        book_status: status,
        has_book: !!bookStatus
      };
    });

    return NextResponse.json({ memberStatuses }, { status: 200 });

  } catch (error) {
    console.error('Error fetching member book statuses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 